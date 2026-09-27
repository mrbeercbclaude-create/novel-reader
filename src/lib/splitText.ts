export type Draft = {
  title: string;
  text: string;
};

export function splitText(text: string): Draft[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const starts: { index: number; title: string }[] = [];

  lines.forEach((line, index) => {
    const value = line.trim();
    if (/^(บทที่|ตอนที่|chapter\s+\d+|#\s+\S)/i.test(value)) {
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
