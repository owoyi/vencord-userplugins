import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import definePlugin, { StartAt } from "@utils/types";

const SendButton: ChatBarButtonFactory = ({ isMainChat }) => {
	
	if (!isMainChat) return null;

    const handleClick = async () => {
		const textarea = document.querySelector('div[contenteditable="true"][data-slate-editor="true"]');
		if (!textarea) return console.warn("Could not find textarea");
		const press = new KeyboardEvent("keydown", {key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true});
		textarea.dispatchEvent(press);
    };

    return (
        <ChatBarButton tooltip="Send Message" onClick={handleClick}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                width="20"
                height="20"
                viewBox="0 0 24 24"
            >
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "SendButton",
    description: "Adds a clickable send button.",
    authors: [{ name: "otteobi", id: 524980170554212363n }],
	startAt: StartAt.Init,
	
    renderChatBarButton: SendButton,
});
