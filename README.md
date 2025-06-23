<div align="center">

![Vencord Logo](https://github.com/D3SOX/vencord-userplugins/assets/24937357/f5c06f0e-9d8c-4cca-b990-953d675ec71d)
# Ottobi's Vencord userplugins

</div>

These are all my Vencord plugins that are not yet in the [official Vencord repository](https://vencord.dev/plugins#d3sox).

👆 [**SendButton**](https://github.com/owoyi/vencord-userplugins/tree/main/SendButton) `🍴 Forked from BetterDiscord`  
Adds a send button to channels where you have the permission to send messages.

🗓️ [**AutoAttendance**](https://github.com/owoyi/vencord-userplugins/tree/main/AutoAttendance) `⚠️ Self-bot | 🌐 Korean `   
Automatically sends attendance messages to the Discord channel that you set up

  
  
# Install

If you don't know how to install userplugins in the first place please see the manual [Vencord installation guide](https://docs.vencord.dev/installing/). If using Vesktop specify the location in Vesktop settings instead of running `pnpm inject`

> [!TIP]
> There's also [this video by Syncxv](https://youtu.be/8wexjSo8fNw) which shows how to install a userplugin on Windows.
> Just be sure to replace the `git clone` command with the URL from the plugin you like

Clone the repository inside your Vencord `src/userplugins` folder (create the `userplugins` folder if it doesn't exist)
```bash
cd Vencord/src/userplugins
git clone https://github.com/owoyi/vc-pluginName
pnpm build
````

# Update

To update just pull the latest changes inside the repository folder and sync the changes
```bash
cd Vencord/src/userplugins/vc-pluginName
git pull
pnpm build
```
