import { Box, Typography } from "@mui/material";

const Footer = () => {
    return (
        <Box
            sx={{
                py: 4,
                textAlign: "center",
                backgroundColor: "grey.100",
                minHeight: "5vh"
            }}
        >
        <Typography variant="body2">
                <span>© {new Date().getFullYear()}</span>
                <span style={{ marginLeft: '0.25em' }}>
                <a href="https://github.com/alvarez-moreno-sergio/handshake-frontend" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                    Handshake
                </a>
                </span>
        </Typography>
        </Box>
    );
};

export default Footer;
