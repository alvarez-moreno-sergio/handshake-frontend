import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";
import type { JSX } from "react";

const Navbar = (): JSX.Element => {
    return (
        <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar>
            <Box display="flex" alignItems="center" sx={{ flexGrow: 1, minHeight: "5vh" }} component={Link} to="/">
                <img
                    src={'/Handshake.png'}
                    alt="Handshake Logo"
                    style={{ width: 56, height: 56, marginRight: 8 }} />
            </Box>
            <Box>
                <Button color="primary" component={Link} to="/features">Features</Button>
                <Button color="primary" component={Link} to="/cryptography">Cryptography</Button>
                <Button variant="contained" color="secondary" sx={{ color: "white" }} component={Link} to="/chat">Start Chatting</Button>
            </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
