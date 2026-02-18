"use client";
import { indigo } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: "class",
    },
    colorSchemes: {
        dark: true,
        light: true,
    },
});

export default theme;
