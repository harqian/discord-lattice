# Privacy Policy for Discord Friends Graph

Last updated: March 1, 2026

This Privacy Policy describes how the Discord Friends Graph Chrome extension ("Discord Friends Graph", "the extension", "we", "us", or "our") collects, uses, stores, and shares information when you use the extension.

## Summary

Discord Friends Graph is a local-first Chrome extension that helps you visualize your Discord friend network. The extension does not operate a backend service and does not send collected data to the developer's servers.

## Information the Extension Accesses or Collects

When you choose to scan your Discord friend network, the extension may access the following information from your active Discord web session:

- Discord authentication/session data needed to make Discord requests on your behalf from your local browser session
- Your Discord friend list
- Mutual friend relationship data between your account and your Discord friends
- Mutual server information returned by Discord, including server names and server-specific nicknames when available
- Discord user profile fields needed to display the graph, such as user IDs, usernames, display names, discriminators, avatar references, and profile links

The extension also stores the following information locally in your browser after a scan or import:

- Scanned connection graph data
- Scan progress state
- Graph preferences such as the "hide names" setting
- Data that you choose to import from a JSON file

## How the Information Is Used

The extension uses this information only to provide its core functionality:

- build and display a graph of your Discord friend network
- show mutual connections and mutual servers
- allow you to save, clear, export, and import graph data locally
- preserve scan progress and local display preferences

## Storage and Retention

- Scanned graph data is stored locally in `chrome.storage.local` in your browser profile until you delete it, overwrite it, or uninstall the extension.
- Imported graph data is stored locally in `chrome.storage.local` until you delete it, overwrite it, or uninstall the extension.
- Exported JSON files are stored wherever you choose to save them through Chrome's download flow.
- Discord authentication/session data accessed during scanning is used transiently to complete requests and is not intentionally written by the extension to persistent storage.

## Data Sharing

We do not sell your data.

We do not transfer scanned graph data to the developer's servers.

We do not use third-party analytics, advertising, tracking pixels, or remote logging services.

Data may be shared only in the following limited cases:

- with Discord, when the extension sends requests from your browser to Discord endpoints needed to build the graph
- with your local device storage, when Chrome stores extension data in `chrome.storage.local`
- with any person or service you choose to share an exported JSON file with
- if required to comply with applicable law, regulation, legal process, or enforceable governmental request

## Remote Resources

The extension may display Discord-hosted avatar images and other Discord profile-related resources directly from Discord-controlled URLs in the extension UI. This is done to render the graph and related profile views.

## Your Choices and Controls

You can:

- choose whether to start a scan
- choose how many friends to scan
- stop a scan in progress
- clear stored extension data at any time
- export your locally stored graph data
- import previously exported graph data
- uninstall the extension to remove extension-managed local storage from Chrome

## Security

The extension is designed to operate locally in your browser and does not intentionally transmit scanned graph data to the developer's own servers. However, no software or local storage mechanism can be guaranteed to be perfectly secure. You are responsible for protecting your device, browser profile, and any exported files.

## Children's Privacy

The extension is not directed to children under 13, and we do not knowingly collect personal information from children through a developer-operated service.

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date above. Your continued use of the extension after a change means the updated policy applies going forward.

## Contact

For questions about this Privacy Policy, contact:

- Name: [Your name or organization]
- Email: [Your contact email]
- Website or support page: [Your website or support URL]
