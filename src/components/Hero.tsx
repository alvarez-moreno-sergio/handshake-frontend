import type { JSX } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";

const Hero = (): JSX.Element => {
  return (
    <Box
      sx={{
        minHeight: "88vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "primary.main",
        color: "white",
        px: 4, // horizontal padding
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={4}
        alignItems="center"
        justifyContent="center"
        maxWidth="lg"
        width="100%"
      >
        {/* Image */}
        <Box
            component="img"
            src="/Handshake_logo.png"
            alt="Handshake Logo"
            sx={{
                width: { xs: "150px", sm: "200px", md: "256px" }, // responsive breakpoints
                height: "auto",
            }}
        />


        {/* Text */}
        <Box>
          <Typography variant="h2" gutterBottom>
            Cryptographic chat made easy.
          </Typography>

          <Typography variant="h6" gutterBottom>
            Experience secure and private messaging with Handshake, leveraging cutting-edge cryptography to protect your conversations.
          </Typography>

          <Button variant="contained" color="secondary" size="large" sx={{ mt: 3, color: "white" }} component={Link} to="/chat">
            Start Chatting
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default Hero;
