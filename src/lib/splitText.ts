export type Draft = {
  title: string;
  text: string;
};

const HEADING = /^(บทที่|ตอนที่|chapter\s+\d+|#\s+\S)/i;

// Text copied straight from a ChatGPT chat can carry the writer's continuity
// notes and "part 1 of 2" markers. Drop them so only the story is imported.
function stripChatNotes(lines: string[]): string[] {
  const kept: string[] = [];
  let inNotes = false;
  for (const line of lines) {
    const value = line.trim();
    if (value.includes('บันทึกความต่อเนื่อง')) {
      inNotes = true;
      continue;
    }
    if (inNotes && !HEADING.test(value)) continue;
    inNotes = false;
    if (/^\[ยังไม่จบบท/.test(value)) continue;
    kept.push(line);
  }
  return kept;
}

export function splitText(text: string): Draft[] {
  const lines = stripChatNotes(text.replace(/\r/g, '').split('\n'));
  const starts: { index: number; title: string }[] = [];

  lines.forEach((line, index) => {
    const value = line.trim();
    if (HEADING.test(value)) {
      starts.push({ index, title: value.replace(/^#\s*/, '') });
    }
  });

  if (!starts.length) return [{ title: 'บทที่ 1', text: text.trim() }];
  if (lines.slice(0, starts[0].index).join('\n').trim()) {
    starts.unshift({ index: 0, title: 'บทนำ' });
  }

  return starts.map((item, index) => {
    const firstLine = item.index + (item.title === 'บทนำ' ? 0 : 1);
    const end = starts[index + 1]?.index;
    return {
      title: item.title,
      text: lines.slice(firstLine, end).join('\n').trim(),
    };
  }).filter(chapter => chapter.text);
}
