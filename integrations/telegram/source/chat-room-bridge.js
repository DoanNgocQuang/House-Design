export function createTelegramChatBridge(ctx, {sendMessage, escapeMarkdownV2, getRuntime, editMessage, answerCallbackQuery}) {
  const OFFICE='4d696994-e10d-4a05-a063-ca8b6e95de80';
  const scope=(co,key)=>({scopeKind:'company',scopeId:co,stateKey:key});
  const record=(co,id)=>scope(co,'office_chat_question_'+id);
  const index=co=>scope(co,'office_chat_questions');
  const locks=new Map();
  const run=(co,fn)=>{const previous=locks.get(co)??Promise.resolve();const next=previous.catch(()=>{}).then(fn);locks.set(co,next);return next.finally(()=>{if(locks.get(co)===next)locks.delete(co);});};
  const allowed=(config,chat,user=chat)=>/^[1-9][0-9]*$/.test(String(chat))&&String(config.defaultChatId??'')===String(chat)&&Array.isArray(config.allowedTelegramChatIds)&&config.allowedTelegramChatIds.some(x=>String(x)===String(chat))&&Array.isArray(config.allowedTelegramUserIds)&&config.allowedTelegramUserIds.some(x=>String(x)===String(user));
  const cleanChoices=raw=>Array.isArray(raw)?raw.filter(c=>c&&/^choice-[0-4]$/.test(c.id)&&typeof c.label==='string'&&c.label.length<=60&&typeof c.value==='string'&&c.value.length<=2000).slice(0,5):[];
  const keyboard=q=>(q.choices??[]).map((c,index)=>[{text:c.label,callback_data:'office_choice:'+index}]);
  const questionText=q=>['Chat room cần bạn quyết định',q.topic,'',q.question.slice(0,2900),'',q.choices?.length?'Bấm một phương án bên dưới. Nếu muốn trả lời khác, dùng Reply (Trả lời) vào tin này.':'Nhấn Reply (Trả lời) vào CHÍNH tin này để xác nhận hoặc bổ sung yêu cầu.','Câu trả lời sẽ đưa về đúng phòng và chủ trì tiếp tục nếu còn lượt.'].join('\n');
  async function tell(rt,chat,text,options){return sendMessage(ctx,rt.token,chat,text,options);}
  async function acknowledgeResult(co,q){
        const rt=getRuntime();if(q.ackSent||!rt||rt.companyId!==co||!allowed(rt.config,q.chatId,q.reply.userId))return;
        const text=q.result.outcome==='running'?'Đã đưa câu trả lời vào Chat room và gọi chủ trì tiếp tục.':q.result.outcome==='queued'?'Đã lưu câu trả lời. Phòng đang xếp hàng, sẽ tiếp tục khi đến lượt.':q.result.outcome==='duplicate'?'Câu trả lời này đã được Chat room xử lý.':q.result.outcome==='limit'?'Đã lưu câu trả lời, nhưng phòng đã hết giới hạn lượt. Hãy mở phiên mới để trao đổi tiếp.':q.result.outcome==='stale'?'Yêu cầu này đã hết hiệu lực hoặc phòng đã kết thúc. Hãy kiểm tra phòng trong Paperclip.':'Đã gặp lỗi khi tiếp tục phòng. Mở Chat room để xem trạng thái; chưa tự chạy thêm agent.';
        if(q.choices?.length&&editMessage)await editMessage(ctx,rt.token,q.chatId,q.messageId,questionText(q)+'\n\nĐã xử lý câu trả lời.',{inlineKeyboard:[]});
        await tell(rt,q.chatId,text);q.ackSent=true;await ctx.state.set(record(co,q.requestId),q);
  }
  async function deliver(co){
    const rt=getRuntime();if(!rt||rt.companyId!==co)return;
    const chat=String(rt.config.defaultChatId??'');if(!allowed(rt.config,chat))return;
    for(const id of (await ctx.state.get(index(co)))??[]){
      const q=await ctx.state.get(record(co,id));if(!q)continue;
      if(q.result){await acknowledgeResult(co,q);continue;}
      if(!q.messageId){
        const issue=await ctx.issues.get(q.issueId,co);if(!issue||['done','cancelled'].includes(issue.status))continue;
        const text=questionText(q);
        const messageId=await tell(rt,chat,text,{inlineKeyboard:keyboard(q)});if(!messageId)throw Error('Telegram did not return a question message ID');
        q.messageId=messageId;q.chatId=chat;q.keyboardVersion=JSON.stringify(q.choices??[]);await ctx.state.set(record(co,id),q);
      }
      const signature=JSON.stringify(q.choices??[]);
      if(q.messageId&&q.keyboardVersion!==signature&&editMessage){if(!await editMessage(ctx,rt.token,q.chatId,q.messageId,questionText(q),{inlineKeyboard:keyboard(q)}))throw Error('Could not update question buttons');q.keyboardVersion=signature;await ctx.state.set(record(co,id),q);}
      await ctx.state.set({scopeKind:'instance',stateKey:'office_chat_msg_'+q.chatId+'_'+q.messageId},{companyId:co,requestId:id});
      await ctx.events.emit('chat-room-question-sent',co,{roomKey:q.roomKey,requestId:q.requestId});
      if(q.reply&&!q.result)await ctx.events.emit('chat-room-reply',co,{...q.reply,roomKey:q.roomKey,requestId:q.requestId});
    }
  }
  return {
    register(){
      ctx.events.on('plugin.'+OFFICE+'.chat-needs-user',event=>this.receiveQuestion(event));
      ctx.events.on('plugin.'+OFFICE+'.chat-room-reply-result',event=>this.receiveResult(event));
      ctx.events.on('plugin.'+OFFICE+'.chat-room-question-closed',event=>this.receiveClosed(event));
    },
    async receiveQuestion(event){
      if(event.actorType!=='plugin'||event.actorId!==OFFICE||!event.companyId)return;
      const p=event.payload;if(!p||typeof p.requestId!=='string'||!/^[a-zA-Z0-9_-]{1,120}$/.test(p.requestId)||typeof p.roomKey!=='string'||p.roomKey.length>250||typeof p.issueId!=='string'||typeof p.question!=='string'||!p.question.trim())return;
      return run(event.companyId,async()=>{
        const co=event.companyId;const issue=await ctx.issues.get(p.issueId,co);if(!issue)return;
        const old=await ctx.state.get(record(co,p.requestId));if(old&&(old.roomKey!==p.roomKey||old.issueId!==p.issueId))throw Error('Question identity mismatch');
        if(old?.result)return;
        const choices=cleanChoices(p.choices);
        if(old&&!old.reply&&JSON.stringify(old.choices??[])!==JSON.stringify(choices)){old.choices=choices;await ctx.state.set(record(co,p.requestId),old);}
        if(!old)await ctx.state.set(record(co,p.requestId),{requestId:p.requestId,roomKey:p.roomKey,issueId:p.issueId,topic:String(p.topic??issue.title).slice(0,200),question:p.question.slice(0,12000),choices,createdAt:Date.now()});
        const ids=(await ctx.state.get(index(co)))??[];
        if(!ids.includes(p.requestId)){
          const keep=[];for(const id of ids){const q=await ctx.state.get(record(co,id));if(q&&!q.result)keep.push(id);}
          if(keep.length>=30)throw Error('Too many pending Chat room questions');
          await ctx.state.set(index(co),[...keep,p.requestId]);
        }
        await deliver(co);
      });
    },
    async handleReply(update, config, choiceId){
      const msg=update.message,chat=String(msg?.chat?.id??''),user=String(msg?.from?.id??'');
      if(!msg?.text||!msg.reply_to_message?.from?.is_bot||!allowed(config,chat,user))return false;
      const mapping=await ctx.state.get({scopeKind:'instance',stateKey:'office_chat_msg_'+chat+'_'+msg.reply_to_message.message_id});if(!mapping)return false;
      const rt=getRuntime();if(!rt||rt.companyId!==mapping.companyId)return true;
      await run(mapping.companyId,async()=>{
        const co=mapping.companyId,q=await ctx.state.get(record(co,mapping.requestId));if(!q||String(q.chatId)!==chat)return;
        if(q.result){await tell(rt,chat,'Yêu cầu này đã được xử lý. Trả lời tin hỏi mới nhất nếu cần bổ sung.');return;}
        if(msg.text.length>4000){await tell(rt,chat,'Câu trả lời dài quá 4000 ký tự. Hãy rút gọn hoặc bổ sung trong Paperclip.');return;}
        if(q.reply&&q.reply.providerMessageId!==chat+':'+msg.message_id){await tell(rt,chat,'Câu trả lời trước đang được chuyển về phòng. Vui lòng chờ xác nhận.');return;}
        const choice=choiceId?(q.choices??[]).find(c=>c.id===choiceId):null;if(choiceId&&!choice)return;
        q.reply={providerMessageId:chat+':'+msg.message_id,text:choice?choice.value:msg.text.trim(),choiceId:choice?.id,chatId:chat,userId:user};await ctx.state.set(record(co,q.requestId),q);
        if(!q.receiptSent){await tell(rt,chat,'Đã nhận câu trả lời. Đang chuyển về Chat room…');q.receiptSent=true;await ctx.state.set(record(co,q.requestId),q);}
        await ctx.events.emit('chat-room-reply',co,{...q.reply,roomKey:q.roomKey,requestId:q.requestId});
      });return true;
    },
    async handleCallback(update,config){
      const query=update.callback_query;if(!query?.data?.startsWith('office_choice:'))return false;
      const rt=getRuntime(),chat=String(query.message?.chat?.id??''),user=String(query.from?.id??'');
      const respond=text=>answerCallbackQuery&&rt?answerCallbackQuery(ctx,rt.token,query.id,text):Promise.resolve();
      if(!rt||!allowed(config,chat,user)){await respond('Bạn không có quyền trả lời câu hỏi này.');return true;}
      const match=query.data.match(/^office_choice:([0-4])$/),messageId=query.message?.message_id;
      const mapping=messageId?await ctx.state.get({scopeKind:'instance',stateKey:'office_chat_msg_'+chat+'_'+messageId}):null;
      if(!match||!mapping||mapping.companyId!==rt.companyId){await respond('Câu hỏi không còn hợp lệ.');return true;}
      const q=await ctx.state.get(record(mapping.companyId,mapping.requestId));
      if(!q||q.result||String(q.chatId)!==chat){await respond('Câu hỏi đã được xử lý.');return true;}
      const choice=(q.choices??[])[Number(match[1])];if(!choice){await respond('Lựa chọn không hợp lệ.');return true;}
      await respond('Đã nhận: '+choice.label);
      await this.handleReply({message:{message_id:'button-'+query.id,from:query.from,chat:query.message.chat,text:choice.value,reply_to_message:{message_id:messageId,from:{is_bot:true}}}},config,choice.id);
      return true;
    },
    async receiveClosed(event){
      if(event.actorType!=='plugin'||event.actorId!==OFFICE||!event.companyId)return;
      const p=event.payload;if(!p?.requestId||!p.roomKey)return;
      return run(event.companyId,async()=>{
        const co=event.companyId,q=await ctx.state.get(record(co,p.requestId));
        if(!q){await ctx.state.set(record(co,p.requestId),{requestId:p.requestId,roomKey:p.roomKey,issueId:p.issueId,result:{outcome:'answered_elsewhere'},ackSent:true});return;}
        if(q.roomKey!==p.roomKey||q.result)return;
        q.result={outcome:'answered_elsewhere',at:Date.now()};q.ackSent=true;await ctx.state.set(record(co,p.requestId),q);
        const rt=getRuntime();if(rt&&rt.companyId===co&&allowed(rt.config,q.chatId)&&editMessage&&q.messageId)await editMessage(ctx,rt.token,q.chatId,q.messageId,questionText(q)+'\n\nĐã trả lời trong Chat room.',{inlineKeyboard:[]});
      });
    },
    async receiveResult(event){
      if(event.actorType!=='plugin'||event.actorId!==OFFICE||!event.companyId)return;
      const p=event.payload;if(!p?.requestId||!p.providerMessageId)return;
      return run(event.companyId,async()=>{
        const co=event.companyId,q=await ctx.state.get(record(co,p.requestId));
        if(!q?.reply||q.roomKey!==p.roomKey||q.reply.providerMessageId!==p.providerMessageId)return;
        if(!q.result){q.result={outcome:p.outcome,at:Date.now()};await ctx.state.set(record(co,q.requestId),q);}
        await acknowledgeResult(co,q);
      });
    },
    async tick(rt){if(!rt)return;await run(rt.companyId,()=>deliver(rt.companyId));await ctx.events.emit('chat-room-sync-request',rt.companyId,{});}
  };
}
