import { Container, Typography, Paper, Stack } from "@mui/material";

const features = [
    { title: "AES-GCM 256", description: "Simetric encryption standard used worldwide to secure sensitive data." },
    { title: "RSA-OAEP 2048", description: "Asymmetric encryption algorithm used for secure key exchange." },
    { title: "RSA-PSS 2048", description: "Asymmetric signature algorithm used for digital signatures." },
    { title: "Hybrid Encryption", description: "Hybrid encryption combines symmetric and asymmetric encryption for enhanced security." }
];

const CryptographyComponent = () => {
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

export default CryptographyComponent;
