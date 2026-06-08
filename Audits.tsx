@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Inter:ital,wght@0,100..900;1,100..900&family=Space+Grotesk:wght@300..700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
@import "tailwindcss";

@theme {
  --font-plus: "Plus Jakarta Sans", sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  
  --color-indigo-core: #6366F1;
  --color-violet-core: #8B5CF6;
  --color-cyan-core: #06B6D4;
  --color-success-core: #10B981;
  --color-warning-core: #F59E0B;
  --color-danger-core: #EF4444;
  
  --radius-xl-card: 24px;
  --radius-lg-btn: 16px;
  --radius-lg-input: 16px;
  --radius-xl-modal: 28px;
}

:root {
  --primary: #6366F1;
  --secondary: #8B5CF6;
  --accent: #06B6D4;
  --success: #10B981;
  --warning: #F59E0B;
  --danger: #EF4444;
  
  --bg-gradient-start: #0F172A;
  --bg-gradient-end: #090D16;
  --card-bg: rgba(30, 41, 59, 0.7);
  --card-border: rgba(255, 255, 255, 0.08);
  --text-primary: #F8FAFC;
  --text-muted: #94A3B8;
  --surface: #111827;
  
  --theme-transition: background-color 300ms ease, border-color 300ms ease, color 300ms ease, box-shadow 300ms ease;
}

[data-theme='light'] {
  --bg-gradient-start: #F8FAFC;
  --bg-gradient-end: #f1f5f9;
  --card-bg: rgba(255, 255, 255, 0.8);
  --card-border: rgba(99, 102, 241, 0.08);
  --text-primary: #0F172A;
  --text-muted: #64748B;
  --surface: #FFFFFF;
}

body {
  font-family: var(--font-sans);
  background: radial-gradient(circle at top left, var(--bg-gradient-start), var(--bg-gradient-end));
  background-attachment: fixed;
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  transition: var(--theme-transition);
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.5);
}

/* Skeleton Loading Shimmer */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

[data-theme='light'] .shimmer {
  background: linear-gradient(90deg, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.03) 75%);
  background-size: 200% 100%;
}

/* Glassmorphism Classes */
.glass-panel {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--card-border);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  border-radius: 24px;
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 250ms cubic-bezier(0.16, 1, 0.3, 1), border-color 250ms ease;
}

.glass-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.3), 0 0 1px 1px rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.25);
}

[data-theme='light'] .glass-panel {
  box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.05);
}

[data-theme='light'] .glass-panel:hover {
  box-shadow: 0 12px 40px 0 rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.15);
}

/* Custom Gradients */
.gradient-primary {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
}

.gradient-accent {
  background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
}

.gradient-rose {
  background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%);
}

/* Text glow styles */
.text-glow-indigo {
  text-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

.text-glow-success {
  text-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
}

/* Float Animation */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

/* Table Design and Row Overrides for compliance compatibility */
table {
  border-collapse: separate;
  border-spacing: 0;
}

tr th {
  font-family: var(--font-plus);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
