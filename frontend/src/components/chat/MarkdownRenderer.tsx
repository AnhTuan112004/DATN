import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const sanitizedHtml = useMemo(() => {
    try {
      // Cấu hình marked xử lý xuống dòng và GitHub Flavored Markdown (bảng, danh sách)
      const parsed = marked.parse(content, {
        breaks: true,
        gfm: true,
      });

      // Nếu marked trả về string (mặc định đồng bộ khi không dùng async extensions)
      const rawHtml = typeof parsed === 'string' ? parsed : '';
      
      // Lọc sạch XSS qua DOMPurify
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target'],
      });
    } catch (err) {
      console.error('Lỗi khi parse Markdown:', err);
      return DOMPurify.sanitize(content);
    }
  }, [content]);

  return (
    <div
      className="ai-markdown-content text-xs text-slate-800 dark:text-slate-100 leading-relaxed space-y-2 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
