import React from "react";

export function stripInlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,6}\s+/g, "")
    .replace(/^[-*]\s+/g, "")
    .trim();
}

export function deriveTitleFromContent(content) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return "Untitled Note";
  }

  const codeFenceMatch = trimmedContent.match(/^```([a-z0-9_-]+)?/im);
  if (codeFenceMatch && trimmedContent.replace(/```/g, "").trim().split("\n").length <= 6) {
    const language = codeFenceMatch[1]?.toUpperCase() || "Code";
    return `${language} snippet`;
  }

  const lines = trimmedContent
    .split("\n")
    .map((line) => stripInlineMarkdown(line))
    .filter(Boolean);

  const firstMeaningfulLine = lines.find((line) => !/^```/.test(line));
  if (!firstMeaningfulLine) {
    return "Untitled Note";
  }

  return firstMeaningfulLine.length > 68
    ? `${firstMeaningfulLine.slice(0, 68).trimEnd()}...`
    : firstMeaningfulLine;
}

export function getNextUntitledTitle(notes) {
  const taken = new Set(notes.filter((n) => !n.isDeleted).map((n) => n.title));
  if (!taken.has("Untitled Note")) return "Untitled Note";
  let i = 2;
  while (taken.has(`Untitled Note ${i}`)) i++;
  return `Untitled Note ${i}`;
}

export function shouldStoreVersion(previousNote, nextNote) {
  if (!previousNote) {
    return true;
  }

  const contentChanged = previousNote.content !== nextNote.content;
  const titleChanged = previousNote.title !== nextNote.title;
  const tagsChanged = JSON.stringify(previousNote.tags) !== JSON.stringify(nextNote.tags);
  const collaboratorsChanged =
    JSON.stringify(previousNote.collaborators) !== JSON.stringify(nextNote.collaborators);
  const folderChanged = previousNote.folderId !== nextNote.folderId;
  const colorChanged = previousNote.color !== nextNote.color;

  if (!contentChanged && !titleChanged && !tagsChanged && !collaboratorsChanged && !folderChanged && !colorChanged) {
    return false;
  }

  const previousSnapshot = previousNote.versions?.[0];
  if (!previousSnapshot) {
    return true;
  }

  const elapsed = new Date(nextNote.updatedAt).getTime() - new Date(previousSnapshot.savedAt).getTime();
  const contentDelta = Math.abs((nextNote.content || "").length - (previousNote.content || "").length);

  return elapsed >= 60_000 || titleChanged || collaboratorsChanged || tagsChanged || folderChanged || colorChanged || contentDelta >= 120;
}

function parseInlineMarkdown(text, keyPrefix) {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("**")) {
      parts.push(
        React.createElement("strong", { key: `${keyPrefix}-strong-${partIndex++}` }, token.slice(2, -2))
      );
    } else if (token.startsWith("*")) {
      parts.push(
        React.createElement("em", { key: `${keyPrefix}-em-${partIndex++}` }, token.slice(1, -1))
      );
    } else if (token.startsWith("`")) {
      parts.push(
        React.createElement("code", { key: `${keyPrefix}-code-${partIndex++}` }, token.slice(1, -1))
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          React.createElement(
            "a",
            { key: `${keyPrefix}-link-${partIndex++}`, href: linkMatch[2], target: "_blank", rel: "noreferrer" },
            linkMatch[1]
          )
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function renderMarkdown(content) {
  const lines = content.split("\n");
  const nodes = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      nodes.push(React.createElement("div", { key: `gap-${index}`, className: "preview-gap" }));
      index += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const language = line.trim().replace(/^```/, "").trim();
      const codeLines = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length && /^```/.test(lines[index].trim())) {
        index += 1;
      }

      nodes.push(
        React.createElement(
          "div",
          { key: `code-${index}`, className: "preview-code-block" },
          language
            ? React.createElement("div", { className: "preview-code-label", key: "label" }, language)
            : null,
          React.createElement("pre", { key: "pre" }, React.createElement("code", null, codeLines.join("\n")))
        )
      );
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#{1,3}/)[0].length;
      const text = line.replace(/^#{1,3}\s+/, "");
      const HeadingTag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      nodes.push(
        React.createElement(HeadingTag, { key: `heading-${index}` }, parseInlineMarkdown(text, `heading-${index}`))
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+\[( |x|X)\]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+\[( |x|X)\]\s+/.test(lines[index])) {
        const match = lines[index].match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
        items.push({
          checked: match[1].toLowerCase() === "x",
          text: match[2]
        });
        index += 1;
      }

      nodes.push(
        React.createElement(
          "ul",
          { key: `checklist-${index}`, className: "preview-checklist" },
          items.map((item, itemIndex) =>
            React.createElement(
              "li",
              { key: `check-${index}-${itemIndex}` },
              React.createElement(
                "label",
                null,
                React.createElement("input", { type: "checkbox", checked: item.checked, readOnly: true }),
                React.createElement("span", null, parseInlineMarkdown(item.text, `check-${index}-${itemIndex}`))
              )
            )
          )
        )
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }

      nodes.push(
        React.createElement(
          "ul",
          { key: `list-${index}`, className: "preview-list" },
          items.map((item, itemIndex) =>
            React.createElement(
              "li",
              { key: `item-${index}-${itemIndex}` },
              parseInlineMarkdown(item, `item-${index}-${itemIndex}`)
            )
          )
        )
      );
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s+/.test(lines[index]) &&
      !/^[-*]\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    nodes.push(
      React.createElement(
        "p",
        { key: `paragraph-${index}`, className: "preview-paragraph" },
        parseInlineMarkdown(paragraph.join(" "), `paragraph-${index}`)
      )
    );
  }

  return nodes;
}
