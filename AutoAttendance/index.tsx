/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
 
import { ApplicationCommandInputType, ApplicationCommandOptionType, Argument, CommandContext } from "@api/Commands";
import { sendMessage } from "@utils/discord";
import { ChannelStore, Menu, MessageStore, Parser, SelectedChannelStore, Timestamp, UserStore, useStateFromStores } from "@webpack/common";
import { Message } from "discord-types/general";
import definePlugin, { Plugin, PluginNative, OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { DeleteIcon } from "@components/Icons";
import { Flex } from "@components/Flex";
import { Text, Checkbox, Button, Forms, React, TextInput, useState } from "@webpack/common";

const logPrefix = `\x1b[33m[AutoAttendance]\x1b[0m`

type Rule = Record<"use" | "channelId" | "commandMessage" | "lastSentDate", string>;

const makeEmptyRule: () => Rule = () => ({
	use: false,
    channelId: "",
    commandMessage: "",
	lastSentDate: ""
});
const makeEmptyRuleArray = () => [makeEmptyRule()];

const settings = definePluginSettings({
	startDelay: {
        type: OptionType.NUMBER,
        description: "디스코드 클라이언트 실행 후 출석을 확인하기 전 딜레이 (단위: ms)",
        default: 1000
    },
	autoEveryMidnight: {
		type: OptionType.BOOLEAN,
		description: "클라이언트가 켜져 있는 상태에서 자정이 되면 출석을 확인합니다. (*수정 시 플러그인 재실행 필요)",
		default: true,
	},
    replace: {
        type: OptionType.COMPONENT,
        component: () => {
            const {attendanceChannels} = settings.use(["attendanceChannels"]);

            return (
                <>
                    <TextReplace
                        title="출석 채널"
                        rulesArray={attendanceChannels}
                    />
                </>
            );
        }
    },
    attendanceChannels: {
        type: OptionType.CUSTOM,
        default: makeEmptyRuleArray(),
    }
});

function Input({ initialValue, onChange, placeholder }: {
    placeholder: string;
    initialValue: string;
    onChange(value: string): void;
}) {
    const [value, setValue] = useState(initialValue);
    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChange={setValue}
            spellCheck={false}
            onBlur={() => value !== initialValue && onChange(value)}
        />
    );
}

function TextReplace({ title, rulesArray }: TextReplaceProps) {
    async function onClickRemove(index: number) {
        if (index === rulesArray.length - 1) return;
        rulesArray.splice(index, 1);
    }

    async function onChange(e: string, index: number, key: string) {
        if (index === rulesArray.length - 1) {
            rulesArray.push(makeEmptyRule());
        }

        rulesArray[index][key] = e;

        if (rulesArray[index].channelId === "" && rulesArray[index].commandMessage === "" && index !== rulesArray.length - 1) {
            rulesArray.splice(index, 1);
        }
    }

    return (
        <>
            <Forms.FormTitle tag="h4">{title}</Forms.FormTitle>
            <Flex flexDirection="column" style={{ gap: "0.5em" }}>
                {
                    rulesArray.map((rule, index) =>
                        <React.Fragment key={`${rule.channelId}-${index}`}>
                            <Flex flexDirection="row" style={{ gap: 0 }}>
                                <Flex flexDirection="row" style={{ flexGrow: 1, gap: "0.5em" }}>
                                    <Input
                                        placeholder="채널 ID"
                                        initialValue={rule.channelId}
                                        onChange={e => onChange(e, index, "channelId")}
                                    />
                                    <Input
                                        placeholder="명령어 (예시: !출석)"
                                        initialValue={rule.commandMessage}
                                        onChange={e => onChange(e, index, "commandMessage")}
                                    />
                                </Flex>
								<Checkbox
									value={rule.use}
									onChange={(_, newValue) => onChange(newValue, index, "use")}
									size={25}
								>
									<Text variant="text-sm/normal">활성화</Text>
								</Checkbox>
                                <Button
                                    size={Button.Sizes.MIN}
                                    onClick={() => onClickRemove(index)}
                                    style={{
                                        background: "none",
                                        color: "var(--status-danger)",
                                        ...(index === rulesArray.length - 1
                                            ? {
                                                visibility: "hidden",
                                                pointerEvents: "none"
                                            }
                                            : {}
                                        )
                                    }}
                                >
                                    <DeleteIcon />
                                </Button>
                            </Flex>
                        </React.Fragment>
                    )
                }
            </Flex>
        </>
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function isAttended(channelId: bigint, command: string, uid?: bigint, date?: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const userId = uid || UserStore.getCurrentUser().id;
    const targetDate = date || today;

    const messages = MessageStore.getMessages(channelId);
	console.log(typeof messages);

    const count = messages.filter(msg => 
        msg.author.id === userId && 
        new Date(msg.timestamp).toISOString().split('T')[0] === targetDate &&
        msg.content === command
    ).length;

    return count > 0; // count가 0보다 크면 true, 그렇지 않으면 false
}

function dateToStringKR(date?: DateType = Date.now()): string {
	return date.toLocaleDateString('ko-KR', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		})
		.replace(/\./g, '')
		.replace(/\s/g, '-');
}
	

async function checkAttendance(): Promise<void> {
	const validChannels = settings.store.attendanceChannels.filter(rule => rule.channelId !== "" && rule.use)
	console.log(`${logPrefix} 🔍 Checking ${validChannels.length} channels`);
	try {
		for (const rule of validChannels) {
			if (!rule.commandMessage) continue;
			
			const targetChannelId = BigInt(rule.channelId);
			const now = new Date();
            const currentDateString = dateToStringKR(now);
			
			if (rule.lastSentDate && rule.lastSentDate === currentDateString) {
                console.log(`${logPrefix} ⏳ Already sent a message to channel ${targetChannelId} today.`);
                continue;
            }
			
			if (await isAttended(targetChannelId, rule.commandMessage)) {
				console.log(`${logPrefix} ⏳ Already attended channel ${targetChannelId}.`);
				continue;
			}
			
			try {
				const sentMessage = await sendMessage(targetChannelId, { content: rule.commandMessage }, false);
				console.log(sentMessage);
				if (sentMessage) {
					rule.lastSentDate = currentDateString;
					console.log(`${logPrefix} ✅ Successfully sent "${rule.commandMessage}" to channel ${targetChannelId}!`);
				} else {
					console.log(`${logPrefix} ❌ Failed to send "${rule.commandMessage}" to channel ${targetChannelId}.`);
				}
			} catch {
				console.log(`${logPrefix} ❌ Failed to send "${rule.commandMessage}" to channel ${targetChannelId}.`);
			}
		}
	} catch (err) {
			console.error(err);
	}
}

export default definePlugin({
    name: "AutoAttendance",
    description: "자동으로 특정 채널에 매일 출석 메시지를 보냅니다. 디스코드를 실행하거나, 자정이 지나면 출석을 확인합니다.",
    authors: [{ name: "otteobi", id: 524980170554212363n }],
	settings,
	
	async start() {
		console.log(`${logPrefix} Plugin started!`)
		
		await sleep(settings.store.startDelay || 1000);
		await checkAttendance();
		
		if (settings.store.autoEveryMidnight) {
			const now = new Date();
			const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0); // 다음 날 자정 00:00
			const millisUntilMidnight = nextMidnight.getTime() - now.getTime();
			const formattedMidnight = nextMidnight.toLocaleString();

			console.log(`${logPrefix} Attendance will be automatically checked again after ${millisUntilMidnight} milliseconds. (${formattedMidnight})`);

			setTimeout(async () => {
				await checkAttendance();
				console.log(`${logPrefix} checkAttendance function called at midnight.`);

				setInterval(async () => {
					await checkAttendance();
					console.log(`${logPrefix} checkAttendance function called.`);
				}, 24 * 60 * 60 * 1000);
			}, millisUntilMidnight);
		}
	}
});
