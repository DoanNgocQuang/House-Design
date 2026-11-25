import { ISSUE_STORY_POINTS } from "@paperclipai/shared";

export function StoryPointsSelect({ value, onChange }: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <select aria-label="Story Points" value={value ?? ""} className="rounded-md border bg-background px-1.5 py-1 text-xs" onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}>
      <option value="">Unset</option>
      {ISSUE_STORY_POINTS.map((points) => <option key={points} value={points}>{points}</option>)}
    </select>
  );
}
