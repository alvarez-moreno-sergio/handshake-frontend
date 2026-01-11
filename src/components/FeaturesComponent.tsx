import { Container, Typography, Paper, Stack } from "@mui/material";

const features = [
    { title: "End-to-End Encryption", description: "All messages are encrypted on your device and can only be read by the intended recipient." },
    { title: "Signature", description: "Messages are digitally signed to verify the sender's identity and ensure message integrity." },
    { title: "Open Source", description: "Our code is open for review, ensuring transparency and trust in our security practices." },
    { title: "No Data Logging", description: "We do not log or store any user data, ensuring your privacy is always maintained." },
    { title: "No history Tracking", description: "Your message history is stored only on your devices, not on our servers." }
];

const FeaturesComponent = () => {
    return (
        <Container sx={{ py: 8 }}>

        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={4}
            justifyContent="center"
            alignItems="stretch"
        >
            {features.map((feature) => (
                <Paper
                    key={feature.title}
                    sx={{ p: 4, textAlign: "center", flex: 1, backgroundColor: "secondary.main", color: "white" }}
                    elevation={3}
                >
                    <Typography variant="h6" gutterBottom>
                        {feature.title}
                    </Typography>
                    <Typography>{feature.description}</Typography>
                </Paper>
            ))}
        </Stack>
        </Container>
    );
};

export default FeaturesComponent;
