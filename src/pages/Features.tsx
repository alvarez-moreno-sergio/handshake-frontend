import { Typography, Button, Box } from "@mui/material";
import FeaturesComponent from "../components/FeaturesComponent";

const Features = () => {
	return (
        <Box sx={{ flexGrow: 1, height: "88vh", backgroundColor: "primary.main", color: "white", py: 4, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 4 }}>
            <Box display="flex" alignItems="center" justifyContent="center">
                <Typography variant="h2" align="center">
                    Features
                </Typography>
            </Box>
            <Box>
                <FeaturesComponent />
            </Box>
        </Box>
	);
};

export default Features;
