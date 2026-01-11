import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: {
           main: "#26596A"
        },
        secondary: {
            // main: "rgba(155, 39, 176, 0.3)"
            main: "#297C45"
        }
    },
    typography: {
        fontFamily: "Roboto, Arial, sans-serif"
    }
});

export default theme;
