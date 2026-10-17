import { UrlTaPerdOptions } from "../../types";

const WHEEL_INTERACTIVE_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  "[contenteditable='true']",
  "[role='dialog']",
  "[role='menu']",
  "[role='listbox']",
  "[role='slider']",
].join(",");

const KEYBOARD_INTERACTIVE_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  "[contenteditable]",
  "[role~='dialog']",
  "[role~='menu']",
  "[role~='listbox']",
  "[role~='slider']",
].join(",");

const DETAIL_PERIODS = [
  UrlTaPerdOptions.Hour,
  UrlTaPerdOptions.Day,
  UrlTaPerdOptions.Week,
] as const;

type DetailShortcutEvent = Pick<
  KeyboardEvent,
  "altKey" | "ctrlKey" | "defaultPrevented" | "key" | "metaKey" | "shiftKey" | "target"
>;

export function carouselOwnsEvent(event: Pick<Event, "defaultPrevented" | "target" | "currentTarget">) {
  if (event.defaultPrevented || !(event.target instanceof Element)) return false;
  const viewport = event.currentTarget instanceof Element ? event.currentTarget : null;
  return Boolean(viewport && viewport.contains(event.target) && !event.target.closest(WHEEL_INTERACTIVE_SELECTOR));
}

export function shouldHandleDetailShortcut(event: DetailShortcutEvent) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    !["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(event.key) ||
    !(event.target instanceof Element)
  ) {
    return false;
  }

  return !event.target.closest(KEYBOARD_INTERACTIVE_SELECTOR);
}

export function cycleDetailPeriod(
  period: UrlTaPerdOptions,
  direction: "ArrowLeft" | "ArrowRight",
) {
  const currentIndex = DETAIL_PERIODS.indexOf(period as (typeof DETAIL_PERIODS)[number]);
  const offset = direction === "ArrowRight" ? 1 : -1;
  const nextIndex = (currentIndex + offset + DETAIL_PERIODS.length) % DETAIL_PERIODS.length;

  return DETAIL_PERIODS[nextIndex];
}
