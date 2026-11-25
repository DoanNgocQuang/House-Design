export function shouldNotifyApproval(event, onlyBoardApprovals) {
    if (!onlyBoardApprovals)
        return true;
    const payload = event.payload;
    return payload.type === "request_board_approval";
}
