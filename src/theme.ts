
// ========== THEME ==========
import {createGlobalStyle, DefaultTheme} from "styled-components";

export const tokens: DefaultTheme = {
    colors: {
        background: "#0E0E10",
        surface: "#1A1A1D",
        surfaceAlt: "#222224",
        text: "#F8F8F2",
        heartbeat: "#ff1500",
        textSecondary: "#4A4A4D",
        textTertiary: "#8E8E95",
        button: "#FF8A00",
        buttonHover: "#FF9D2E",
        subtext: "#6e6e6e",
        accent: "#FF8A00",
        accentHover: "#FF9D2E",
        border: "#2A2A2D",
        secondary: "#BFBFBF",
        warn: "#FFC940",
        error: "#FF426A",
        info: "#4DDDF6",
        textMuted: "#4A4A4D",
        success: "#10EF75",
        agentNat: "#9333EA",
        agentBrian: "#4DDDF6",
        agentReqqy: "#FF8A00",
        agentJosh: "#E44AFF",
        agentJames: "#22C55E",
        agentTerrell: "#F9C846",
        agentAntosh: "#29A9E2",
        agentManMan: "#7975F7",
        agentLia: "#FF3390",
        agentCompass: "#BCBABE",
        fileTypeColors: {
            folder: "#FF8A00", // Orange
            code: "#3385FF", // Blue
            image: "#33CC33", // Green
            json: "#FFCC00", // Yellow
            stylesheet: "#A459D1", // Purple
            html: "#FF5E99", // Pink
            pdf: '#f40f02',
        },
    },
    radii: {small: 6, medium: 12, large: 24, full: 9999},
    spacing: {xs: 4, sm: 8, md: 16, lg: 24, xl: 32},
    typography: {
        fontFamily: `'Inter',sans-serif`,
        codeFont: `'Fira Code', monospace`,
        fontSize: 16,
        h2Size: 24,
        h6Size: 18,
        h1Size: 32,
        subscript: 12,
        bodyFontWeight: 400,
        headingFontWeight: 700,
    },
    strokeWidth: 2,
    transitions: {default: "all 0.25s cubic-bezier(.4,.1,.25,1)"},
    cardShadow: "0 8px 24px rgba(0,0,0,0.6)",
    headerGlass: "rgba(20,20,20,0.70)",
    glassBlur: "blur(16px)",
    glassTint: "rgba(0,0,0,0.1)"
} as const;

export const GlobalStyle = createGlobalStyle`
    html, body {
        background: ${(p: any) => p.theme.colors.background};
        color: ${(p: any) => p.theme.colors.text};
        margin: 0;
        padding: 0;
        font-family: ${(p: any) => p.theme.typography.fontFamily};
        font-size: ${(p: any) => p.theme.typography.fontSize}px;
        min-height: 100vh;
        overflow-x: hidden;
        transition: background 0.3s;
    }

    * {
        box-sizing: border-box;
    }

    :focus-visible {
        outline: 2px solid ${(p: any) => p.theme.colors.accent};
    }
`;
