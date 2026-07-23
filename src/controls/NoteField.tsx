import { useId } from "react";
import { NOTE_MAX, sanitizeNote } from "../card/cardConfig";
import "./controls.css";

type NoteFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function NoteField({ value, onChange }: NoteFieldProps) {
  const id = useId();
  return (
    <div className="note-field">
      <label className="note-label" htmlFor={id}>
        Engraving
      </label>
      <div className="note-input-wrap">
        <input
          id={id}
          className="note-input"
          type="text"
          value={value}
          placeholder="FOR COFFEE ONLY"
          maxLength={NOTE_MAX}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => onChange(sanitizeNote(e.target.value))}
        />
        <span className="note-count" aria-hidden="true">
          {value.length}/{NOTE_MAX}
        </span>
      </div>
    </div>
  );
}
