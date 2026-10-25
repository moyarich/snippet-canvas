import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ReactGPicker from "react-gcolor-picker";

type ReactGPickerProps = ComponentProps<typeof ReactGPicker>;

interface ColorPickerProps extends ReactGPickerProps {
  label: string;
  className?: string;
  defaultColors: string[];
}

export function ColorPicker({
  label,
  value,
  onChange,
  onDefaultColorSelect,
  className = "",
  defaultColors,
  format = "hex",
  gradient = false,
  solid = true,
  showAlpha = false,
  debounce = true,
  debounceMS = 0,
  popupWidth = 320,
  colorBoardHeight = 160,
  ...pickerProps
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const [textValue, setTextValue] = useState(value);
  const [gradientError, setGradientError] = useState("");
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const editingGradient = /^\s*(?:linear|radial)-gradient\(/i.test(draftValue);
  const rootClassName = [
    "color-field",
    editingGradient ? "gradient-color-field" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const show = () => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const width = Math.min(gradient ? 480 : 380, window.innerWidth - 32);
    const height = Math.min(gradient ? 700 : 510, window.innerHeight - 32);
    const x = Math.min(
      window.innerWidth - width - 16,
      Math.max(16, (trigger?.right ?? 16) + 12),
    );
    const y = Math.min(
      window.innerHeight - height - 16,
      Math.max(16, trigger?.top ?? 16),
    );
    setPosition({ x, y });
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const commit = (nextValue: string) => {
    setDraftValue(nextValue);
    setTextValue(nextValue);
    setGradientError("");
    onChange(nextValue);
  };
  const applyGradientText = () => {
    const nextValue = textValue.trim();
    if (!nextValue || !CSS.supports("background-image", nextValue)) {
      setGradientError(
        "Enter a valid CSS linear-gradient() or radial-gradient().",
      );
      return;
    }
    commit(nextValue);
  };
  const startDragging = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    const origin = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      ...position,
    };
    const move = (moveEvent: PointerEvent) =>
      setPosition({
        x: Math.min(
          window.innerWidth - 180,
          Math.max(0, origin.x + moveEvent.clientX - origin.pointerX),
        ),
        y: Math.min(
          window.innerHeight - 80,
          Math.max(0, origin.y + moveEvent.clientY - origin.pointerY),
        ),
      });
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  };

  useEffect(() => {
    setDraftValue(value);
    setTextValue(value);
    setGradientError("");
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className={rootClassName}>
      <button
        ref={triggerRef}
        type="button"
        className="color-field-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
      >
        <span>{label}</span>
        <span className="color-field-value">{draftValue}</span>
        <span
          className="color-field-swatch"
          style={{ background: draftValue }}
          aria-hidden="true"
        />
      </button>

      {open &&
        createPortal(
          <section
            className={`color-modal ${gradient ? "gradient-modal" : ""}`}
            role="dialog"
            aria-labelledby={titleId}
            style={{ left: position.x, top: position.y }}
          >
            <header
              className="color-modal-header"
              onPointerDown={startDragging}
            >
              <div>
                <strong id={titleId}>{label}</strong>
                <small>Changes are saved as you edit.</small>
              </div>
              <button
                type="button"
                aria-label="Close color picker"
                title="Close"
                onClick={close}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </header>
            <div className="color-modal-body">
              {gradient && editingGradient && (
                <div className="gradient-value-editor">
                  <label htmlFor={`${titleId}-value`}>CSS gradient</label>
                  <div className="gradient-value-input">
                    <textarea
                      id={`${titleId}-value`}
                      aria-invalid={Boolean(gradientError)}
                      value={textValue}
                      rows={2}
                      spellCheck={false}
                      onChange={(event) => {
                        setTextValue(event.target.value);
                        setGradientError("");
                      }}
                      onKeyDown={(event) => {
                        if (
                          (event.metaKey || event.ctrlKey) &&
                          event.key === "Enter"
                        )
                          applyGradientText();
                      }}
                    />
                    <button type="button" onClick={applyGradientText}>
                      Apply
                    </button>
                  </div>
                  {gradientError && <p role="alert">{gradientError}</p>}
                </div>
              )}
              <ReactGPicker
                {...pickerProps}
                value={draftValue}
                onChange={commit}
                onDefaultColorSelect={(color) => {
                  onDefaultColorSelect?.(color);
                  commit(typeof color === "string" ? color : color.gradient);
                }}
                defaultColors={defaultColors}
                format={format}
                gradient={gradient}
                solid={solid}
                showAlpha={showAlpha}
                debounce={debounce}
                debounceMS={debounceMS}
                popupWidth={popupWidth}
                colorBoardHeight={colorBoardHeight}
                showGradientResult={true}
              />
            </div>
            <footer className="color-modal-footer">
              <button type="button" onClick={close}>
                Done
              </button>
            </footer>
          </section>,
          document.body,
        )}
    </div>
  );
}
