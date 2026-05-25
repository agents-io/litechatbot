import { useRef, useState, type ReactElement } from "react";

export interface UploadForReviewProps {
  purpose?: string;
  accept?: string;
  maxMb?: number;
  primary: string;
  onPrimary: string;
  border: string;
  surface: string;
  surfaceMuted: string;
  textBody: string;
  textMuted: string;
  onSubmit: (files: File[]) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
  submitted?: boolean;
}

const CLOUD_ICON = "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12";

export function UploadForReview(props: UploadForReviewProps): ReactElement {
  const {
    purpose = "Files",
    accept = "*",
    maxMb = 10,
    primary, onPrimary, border, surface, surfaceMuted, textBody, textMuted,
    onSubmit, onCancel, submitting = false, submitted = false
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);

  function add(picked: FileList | File[]): void {
    const arr = Array.from(picked).filter((f) => f.size <= maxMb * 1024 * 1024);
    setFiles((p) => [...p, ...arr]);
  }
  function remove(i: number): void { setFiles((p) => p.filter((_, j) => j !== i)); }

  if (submitted) {
    return (
      <div style={{
        padding: "12px 16px",
        borderRadius: 14,
        background: surface,
        border: `1px solid ${border}`,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        color: textBody,
        fontSize: 13
      }}>
        ✓ {files.length || 1} file{files.length === 1 ? "" : "s"} submitted for review.
      </div>
    );
  }

  return (
    <div style={{
      padding: 16,
      borderRadius: 14,
      background: surface,
      border: `1px solid ${border}`,
      boxShadow: "0 2px 8px -2px rgba(15,23,42,0.08)"
    }}>
      <p style={{ margin: 0, marginBottom: 12, fontSize: 13, fontWeight: 600, color: textBody }}>
        Upload your {purpose}
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files) add(e.dataTransfer.files);
        }}
        style={{
          border: `1.5px dashed ${drag ? primary : border}`,
          borderRadius: 12,
          padding: "20px 12px",
          textAlign: "center",
          cursor: "pointer",
          background: drag ? `${primary}0a` : surfaceMuted,
          transition: "border-color 120ms ease, background 120ms ease"
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.5" style={{ display: "block", margin: "0 auto 6px" }}>
          <path d={CLOUD_ICON} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: textBody }}>
          Drop file{maxMb > 0 ? "s" : ""} here or click to browse
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: textMuted }}>
          {accept === "*" ? "Any file" : accept} · max {maxMb}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }}
        />
      </div>
      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {files.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px 4px 10px",
                borderRadius: 8,
                background: surfaceMuted,
                border: `1px solid ${border}`,
                fontSize: 12,
                color: textBody,
                maxWidth: 220
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {f.name}</span>
              <button
                onClick={() => remove(i)}
                aria-label={`Remove ${f.name}`}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: textMuted, fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: "transparent",
              color: textMuted,
              border: `1px solid ${border}`,
              fontSize: 13,
              cursor: submitting ? "default" : "pointer"
            }}
          >Cancel</button>
        )}
        <button
          onClick={() => void onSubmit(files)}
          disabled={submitting || files.length === 0}
          style={{
            flex: 1,
            padding: "9px 16px",
            borderRadius: 10,
            background: primary,
            color: onPrimary,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: submitting || files.length === 0 ? "default" : "pointer",
            opacity: submitting || files.length === 0 ? 0.4 : 1
          }}
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
