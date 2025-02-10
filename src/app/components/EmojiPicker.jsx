import EmojiPicker from "emoji-picker-react";

export default function EmojiPickerComponent({ onEmojiClick }) {
  return (
    <div className="absolute bottom-16 left-4 bg-white shadow-lg rounded-lg">
      <EmojiPicker onEmojiClick={onEmojiClick} />
    </div>
  );
}
