"use client";

export default function StatusMessage({ message }) {
  if (!message) return null;

  return (
    <div className={`status status-${message.type || "info"}`} role="status">
      {message.text}
    </div>
  );
}
