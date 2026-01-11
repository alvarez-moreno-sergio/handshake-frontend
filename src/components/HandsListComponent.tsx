import { Box } from "@mui/material";
import HandComponent, { type ApiSafeHand } from "./HandComponent";

type HandsListComponentProps = {
    handList: ApiSafeHand[];
    onSelectHand: (id: string | null) => void;
    unreadMap: Record<string, number>;
}

const HandsListComponent = ({ handList, onSelectHand, unreadMap } : HandsListComponentProps) => {
    return (
        <Box sx={{ flex: 1, overflowY: "auto" }}>
            {handList.map((hand) => (
                <HandComponent key={hand.uuid} hand={hand} chatStatus="idle" onClick={() => onSelectHand(hand.uuid)} unreadMap={unreadMap} />
            ))}
        </Box>
    );
};

export default HandsListComponent;
