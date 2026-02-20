interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "What is react-grep?",
    answer:
      "react-grep is a zero-dependency React developer tool that overlays component names and source file locations on any element when you hold Cmd (Mac) or Ctrl (Windows/Linux). It reads React's internal fiber tree directly, so it works with any React app in development mode without any configuration or framework-specific plugins.",
  },
  {
    question: "How do I install react-grep?",
    answer:
      'Install via your package manager: "npm install -D react-grep", "pnpm add -D react-grep", "yarn add -D react-grep", or "bun add -D react-grep". Then add \'import "react-grep"\' to your app entry point. The inspector activates automatically on import.',
  },
  {
    question: "Does react-grep work with Next.js?",
    answer:
      "Yes. react-grep is tested with Next.js 16 using both Turbopack and Webpack. It includes dedicated support for server component names and Turbopack indexed source maps. It also works with Vite, React Router v7, Gatsby, and esbuild.",
  },
  {
    question: "How is react-grep different from React DevTools?",
    answer:
      "React DevTools requires opening browser devtools and navigating a component tree panel. react-grep shows component names and file locations directly on the page as you hover, without leaving the viewport. It also copies file:line paths to your clipboard for instant editor navigation.",
  },
  {
    question: "Does react-grep have any dependencies?",
    answer:
      "No. react-grep has zero runtime dependencies. The entire library is ~5KB gzipped. It reads React's fiber tree directly and resolves source maps on its own, with no external dependencies required.",
  },
];
