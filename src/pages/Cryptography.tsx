import { Typography, Button, Box } from "@mui/material";
import CryptographyComponent from "../components/CryptographyComponent";

const Cryptography = () => {
	return (
        <Box sx={{ flexGrow: 1, height: "88vh", backgroundColor: "primary.main", color: "white", py: 4, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 4 }}>
            <Box display="flex" alignItems="center" justifyContent="center">
                <Typography variant="h2" align="center">
                    Cryptography
                </Typography>
            </Box>
            <Box>
                <CryptographyComponent />
            </Box>
        </Box>
	);
};

export default Cryptography;
