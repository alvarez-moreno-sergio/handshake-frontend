import { Box } from "@mui/material";
import HandComponent, { type ApiSafeHand } from "./HandComponent";

type HandsListComponentProps = {
    handList: ApiSafeHand[];
    onSelectHand: (id: number | null) => void;
}

const HandsListComponent = ({ handList, onSelectHand } : HandsListComponentProps) => {
    return (
        <Box sx={{ flex: 1, overflowY: "auto" }}>
            {handList.map((hand) => (
                <HandComponent key={hand.uuid} hand={hand} chatStatus="idle" onClick={() => onSelectHand(hand.uuid)} />
            ))}
        </Box>
    );
};

export default HandsListComponent;
