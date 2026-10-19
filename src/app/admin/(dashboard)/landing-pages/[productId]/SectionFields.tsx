"use client";

import { ar } from "@/lib/admin/i18n-ar";
import type { Section } from "@/lib/admin/landing-sections";

const inputCls = "w-full px-3 py-2 border border-black/15 rounded-lg text-sm";
const urlCls = `${inputCls} font-mono`;
const labelCls = "block text-sm font-medium mb-1";
const boxCls = "border border-black/10 rounded-lg p-3 space-y-3";
const addBtnCls =
  "px-3 py-1.5 rounded-lg border border-black/15 text-xs hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent";
const removeBtnCls =
  "shrink-0 px-2 py-1.5 rounded border border-black/15 text-xs text-red-600 hover:bg-red-50";

function replaceAt<T>(arr: T[], index: number, value: T): T[] {
  return arr.map((item, i) => (i === index ? value : item));
}

function removeAt<T>(arr: T[], index: number): T[] {
  return arr.filter((_, i) => i !== index);
}

function localDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Box({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className={boxCls}>
      <div className="flex justify-end">
        <button type="button" onClick={onRemove} className={removeBtnCls}>
          {ar.landing.fields.remove}
        </button>
      </div>
      {children}
    </div>
  );
}

function AddButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={addBtnCls}
    >
      {label}
    </button>
  );
}

export function SectionFields({
  section,
  onChange,
}: {
  section: Section;
  onChange: (props: Section["props"]) => void;
}) {
  switch (section.type) {
    case "hero": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.subtitle}</label>
            <textarea
              className={inputCls}
              rows={2}
              value={props.subtitle}
              maxLength={300}
              onChange={(e) => onChange({ ...props, subtitle: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.imageUrl}</label>
            <input
              className={urlCls}
              dir="ltr"
              value={props.imageUrl ?? ""}
              maxLength={2048}
              onChange={(e) =>
                onChange({
                  ...props,
                  imageUrl: e.target.value ? e.target.value : undefined,
                })
              }
            />
            <p className="text-xs text-black/50 mt-1">
              {ar.landing.fields.imageUrlHelp}
            </p>
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.ctaText}</label>
            <input
              className={inputCls}
              value={props.ctaText}
              maxLength={40}
              onChange={(e) => onChange({ ...props, ctaText: e.target.value })}
            />
          </div>
        </div>
      );
    }

    case "gallery": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.images}</label>
            <div className="space-y-3">
              {props.images.map((image, index) => (
                <Box
                  key={index}
                  onRemove={() =>
                    onChange({ ...props, images: removeAt(props.images, index) })
                  }
                >
                  <div>
                    <label className={labelCls}>
                      {ar.landing.fields.imageUrl}
                    </label>
                    <input
                      className={urlCls}
                      dir="ltr"
                      value={image.imageUrl}
                      maxLength={2048}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          images: replaceAt(props.images, index, {
                            ...image,
                            imageUrl: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{ar.landing.fields.alt}</label>
                    <input
                      className={inputCls}
                      value={image.alt}
                      maxLength={160}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          images: replaceAt(props.images, index, {
                            ...image,
                            alt: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                </Box>
              ))}
            </div>
            <div className="mt-2">
              <AddButton
                label={ar.landing.fields.addImage}
                disabled={props.images.length >= 12}
                onClick={() =>
                  onChange({
                    ...props,
                    images: [...props.images, { imageUrl: "", alt: "" }],
                  })
                }
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.colorName}</label>
            <input
              className={inputCls}
              value={props.colorName}
              maxLength={60}
              onChange={(e) => onChange({ ...props, colorName: e.target.value })}
            />
          </div>
        </div>
      );
    }

    case "features": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.items}</label>
            <div className="space-y-3">
              {props.items.map((item, index) => (
                <Box
                  key={index}
                  onRemove={() =>
                    onChange({ ...props, items: removeAt(props.items, index) })
                  }
                >
                  <div>
                    <label className={labelCls}>{ar.landing.fields.title}</label>
                    <input
                      className={inputCls}
                      value={item.title}
                      maxLength={80}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          items: replaceAt(props.items, index, {
                            ...item,
                            title: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{ar.landing.fields.text}</label>
                    <textarea
                      className={inputCls}
                      rows={2}
                      value={item.text}
                      maxLength={300}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          items: replaceAt(props.items, index, {
                            ...item,
                            text: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {ar.landing.fields.iconUrl}
                    </label>
                    <input
                      className={urlCls}
                      dir="ltr"
                      value={item.iconUrl ?? ""}
                      maxLength={2048}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          items: replaceAt(props.items, index, {
                            ...item,
                            iconUrl: e.target.value ? e.target.value : undefined,
                          }),
                        })
                      }
                    />
                  </div>
                </Box>
              ))}
            </div>
            <div className="mt-2">
              <AddButton
                label={ar.landing.fields.addItem}
                disabled={props.items.length >= 12}
                onClick={() =>
                  onChange({
                    ...props,
                    items: [...props.items, { title: "", text: "" }],
                  })
                }
              />
            </div>
          </div>
        </div>
      );
    }

    case "size_guide": {
      const props = section.props;
      const width = Math.max(
        props.columns.length,
        ...props.rows.map((row) => row.length),
        0
      );
      const setCell = (rowIndex: number, colIndex: number, value: string) => {
        onChange({
          ...props,
          rows: props.rows.map((row, r) => {
            if (r !== rowIndex) return row;
            const next = [...row];
            while (next.length <= colIndex) next.push("");
            next[colIndex] = value;
            return next;
          }),
        });
      };
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <p className="text-xs text-black/50">{ar.landing.fields.sizeGuideHelp}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {Array.from({ length: width }).map((_, colIndex) => (
                    <th key={colIndex} className="p-1 align-top">
                      <input
                        className={inputCls}
                        value={props.columns[colIndex] ?? ""}
                        maxLength={60}
                        onChange={(e) => {
                          const next = [...props.columns];
                          while (next.length <= colIndex) next.push("");
                          next[colIndex] = e.target.value;
                          onChange({ ...props, columns: next });
                        }}
                      />
                      {colIndex < props.columns.length && width > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              ...props,
                              columns: removeAt(props.columns, colIndex),
                              rows: props.rows.map((row) =>
                                removeAt(row, colIndex).length
                                  ? removeAt(row, colIndex)
                                  : [""]
                              ),
                            })
                          }
                          className={`${removeBtnCls} mt-1 w-full`}
                        >
                          {ar.landing.fields.remove}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {props.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Array.from({ length: width }).map((_, colIndex) => (
                      <td key={colIndex} className="p-1">
                        <input
                          className={inputCls}
                          value={row[colIndex] ?? ""}
                          maxLength={100}
                          onChange={(e) =>
                            setCell(rowIndex, colIndex, e.target.value)
                          }
                        />
                      </td>
                    ))}
                    <td className="p-1">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...props,
                            rows: removeAt(props.rows, rowIndex),
                          })
                        }
                        className={removeBtnCls}
                      >
                        {ar.landing.fields.remove}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddButton
              label={ar.landing.fields.addColumn}
              disabled={props.columns.length >= 8}
              onClick={() =>
                onChange({
                  ...props,
                  columns: [...props.columns, ""],
                  rows: props.rows.map((row) => [...row, ""]),
                })
              }
            />
            <AddButton
              label={ar.landing.fields.addRow}
              disabled={props.rows.length >= 30}
              onClick={() =>
                onChange({
                  ...props,
                  rows: [...props.rows, props.columns.map(() => "")],
                })
              }
            />
          </div>
        </div>
      );
    }

    case "before_after": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.pairs}</label>
            <div className="space-y-3">
              {props.pairs.map((pair, index) => (
                <Box
                  key={index}
                  onRemove={() =>
                    onChange({ ...props, pairs: removeAt(props.pairs, index) })
                  }
                >
                  <div>
                    <label className={labelCls}>
                      {ar.landing.fields.beforeUrl}
                    </label>
                    <input
                      className={urlCls}
                      dir="ltr"
                      value={pair.beforeUrl}
                      maxLength={2048}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          pairs: replaceAt(props.pairs, index, {
                            ...pair,
                            beforeUrl: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {ar.landing.fields.afterUrl}
                    </label>
                    <input
                      className={urlCls}
                      dir="ltr"
                      value={pair.afterUrl}
                      maxLength={2048}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          pairs: replaceAt(props.pairs, index, {
                            ...pair,
                            afterUrl: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{ar.landing.fields.caption}</label>
                    <input
                      className={inputCls}
                      value={pair.caption}
                      maxLength={200}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          pairs: replaceAt(props.pairs, index, {
                            ...pair,
                            caption: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                </Box>
              ))}
            </div>
            <div className="mt-2">
              <AddButton
                label={ar.landing.fields.addPair}
                disabled={props.pairs.length >= 10}
                onClick={() =>
                  onChange({
                    ...props,
                    pairs: [
                      ...props.pairs,
                      { beforeUrl: "", afterUrl: "", caption: "" },
                    ],
                  })
                }
              />
            </div>
          </div>
        </div>
      );
    }

    case "testimonials": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.items}</label>
            <div className="space-y-3">
              {props.items.map((item, index) => (
                <Box
                  key={index}
                  onRemove={() =>
                    onChange({ ...props, items: removeAt(props.items, index) })
                  }
                >
                  <div>
                    <label className={labelCls}>{ar.landing.fields.name}</label>
                    <input
                      className={inputCls}
                      value={item.name}
                      maxLength={80}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          items: replaceAt(props.items, index, {
                            ...item,
                            name: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{ar.landing.fields.text}</label>
                    <textarea
                      className={inputCls}
                      rows={3}
                      value={item.text}
                      maxLength={500}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          items: replaceAt(props.items, index, {
                            ...item,
                            text: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        {ar.landing.fields.rating}
                      </label>
                      <select
                        className={inputCls}
                        value={item.rating ?? ""}
                        onChange={(e) =>
                          onChange({
                            ...props,
                            items: replaceAt(props.items, index, {
                              ...item,
                              rating: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            }),
                          })
                        }
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        {ar.landing.fields.imageUrl}
                      </label>
                      <input
                        className={urlCls}
                        dir="ltr"
                        value={item.imageUrl ?? ""}
                        maxLength={2048}
                        onChange={(e) =>
                          onChange({
                            ...props,
                            items: replaceAt(props.items, index, {
                              ...item,
                              imageUrl: e.target.value
                                ? e.target.value
                                : undefined,
                            }),
                          })
                        }
                      />
                    </div>
                  </div>
                </Box>
              ))}
            </div>
            <div className="mt-2">
              <AddButton
                label={ar.landing.fields.addItem}
                disabled={props.items.length >= 10}
                onClick={() =>
                  onChange({
                    ...props,
                    items: [
                      ...props.items,
                      { name: "", text: "", rating: 5 },
                    ],
                  })
                }
              />
            </div>
          </div>
        </div>
      );
    }

    case "faq": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.items}</label>
            <div className="space-y-3">
              {props.items.map((item, index) => (
                <Box
                  key={index}
                  onRemove={() =>
                    onChange({ ...props, items: removeAt(props.items, index) })
                  }
                >
                  <div>
                    <label className={labelCls}>{ar.landing.fields.question}</label>
                    <input
                      className={inputCls}
                      value={item.question}
                      maxLength={200}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          items: replaceAt(props.items, index, {
                            ...item,
                            question: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{ar.landing.fields.answer}</label>
                    <textarea
                      className={inputCls}
                      rows={3}
                      value={item.answer}
                      maxLength={1000}
                      onChange={(e) =>
                        onChange({
                          ...props,
                          items: replaceAt(props.items, index, {
                            ...item,
                            answer: e.target.value,
                          }),
                        })
                      }
                    />
                  </div>
                </Box>
              ))}
            </div>
            <div className="mt-2">
              <AddButton
                label={ar.landing.fields.addItem}
                disabled={props.items.length >= 15}
                onClick={() =>
                  onChange({
                    ...props,
                    items: [...props.items, { question: "", answer: "" }],
                  })
                }
              />
            </div>
          </div>
        </div>
      );
    }

    case "countdown": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.endAt}</label>
            <input
              type="datetime-local"
              className={inputCls}
              dir="ltr"
              value={localDateTime(props.endAt)}
              onChange={(e) =>
                onChange({
                  ...props,
                  endAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : "",
                })
              }
            />
            <p className="text-xs text-black/50 mt-1">
              {ar.landing.fields.countdownHelp}
            </p>
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.note}</label>
            <input
              className={inputCls}
              value={props.note}
              maxLength={200}
              onChange={(e) => onChange({ ...props, note: e.target.value })}
            />
          </div>
        </div>
      );
    }

    case "rich_text": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.text}</label>
            <textarea
              className={inputCls}
              rows={8}
              value={props.text}
              maxLength={4000}
              onChange={(e) => onChange({ ...props, text: e.target.value })}
            />
            <p className="text-xs text-black/50 mt-1">
              {ar.landing.fields.richTextHelp}
            </p>
          </div>
        </div>
      );
    }

    case "order_form": {
      const props = section.props;
      return (
        <div className="space-y-3">
          <div>
            <label className={labelCls}>{ar.landing.fields.title}</label>
            <input
              className={inputCls}
              value={props.title}
              maxLength={120}
              onChange={(e) => onChange({ ...props, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.fields.ctaText}</label>
            <input
              className={inputCls}
              value={props.ctaText}
              maxLength={40}
              onChange={(e) => onChange({ ...props, ctaText: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={props.showStock}
                onChange={(e) =>
                  onChange({ ...props, showStock: e.target.checked })
                }
              />
              {ar.landing.fields.showStock}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={props.showShipping}
                onChange={(e) =>
                  onChange({ ...props, showShipping: e.target.checked })
                }
              />
              {ar.landing.fields.showShipping}
            </label>
          </div>
        </div>
      );
    }

    case "sticky_cta": {
      const props = section.props;
      return (
        <div>
          <label className={labelCls}>{ar.landing.fields.text}</label>
          <input
            className={inputCls}
            value={props.text}
            maxLength={40}
            onChange={(e) => onChange({ ...props, text: e.target.value })}
          />
        </div>
      );
    }

    default:
      return null;
  }
}
