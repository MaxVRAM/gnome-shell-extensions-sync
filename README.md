# Extensions Sync [GNOME]

[![ts](https://badgen.net/badge/icon/typescript?icon=typescript&label)](#)
[![opensource](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](#)
[![licence](https://badges.frapsoft.com/os/gpl/gpl.png?v=103)](https://github.com/oae/gnome-shell-extensions-sync/blob/master/LICENSE)
[![latest](https://img.shields.io/github/v/release/oae/gnome-shell-extensions-sync)](https://github.com/oae/gnome-shell-extensions-sync/releases/latest)
[![compare](https://img.shields.io/github/commits-since/oae/gnome-shell-extensions-sync/latest/master)](https://github.com/oae/gnome-shell-extensions-sync/compare)

Syncs extensions and settings across GNOME installations, including:

- **Shell keybindings**
- **GNOME Tweaks settings**
- **Extensions installations and their configuration**


|               Provider               |              Synced Data             |            Other Settings            |
|:------------------------------------:|:------------------------------------:|:------------------------------------:|
| ![](https://i.imgur.com/4Sv3Jus.png) | ![](https://i.imgur.com/Ii6Q8w3.png) | ![](https://i.imgur.com/OvDy80f.png) |

## Installation

- Directly from [GNOME extensions](https://extensions.gnome.org/extension/1486/extensions-sync/).
- Via the [Extension Manger](https://github.com/mjakeman/extension-manager) "Browse Extensions" tab (just search for "`extension sync`").
- Build from source (steps 1-5 of the [Development steps](#steps) section below)

## GUI Usage

### Providers

- #### GitHub

    1. Create a new gist from [here](https://gist.github.com/) I suggest you make it secret. You will need the gist id for this. You can find it in the url after username. For example on gist url `https://gist.github.com/username/f545156c0083f7eaefa44ab69df4ec37`, gist id will be `f545156c0083f7eaefa44ab69df4ec37`. [Guide](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists)

    2. Create a new token from [here](https://github.com/settings/tokens/new). Only **gist permission** is needed since we edit the gists. [Guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

    3. Open extension settings, select the `Github` provider and fill gist id from first step and user token from second step.

- #### GitLab

    1. Create a new snippet from [here](https://gitlab.com/-/snippets/new) I suggest you make it private. You will need the snippet id for this. You can find it in the url. For example on snippet url `https://gitlab.com/-/snippets/324234234`, snippet id will be `324234234`. [Guide](https://docs.gitlab.com/ee/user/snippets.html#create-snippets)

    2. Create a new token from [here](https://gitlab.com/-/profile/personal_access_tokens). Only **api scope** is needed. [Guide](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token)

    3. Open extension settings, select the `Gitlab` provider and fill snippet id from first step and user token from second step.

- #### Local (manual)

    1. Select a file that has read/write permission by your active user. (default backup file is in `~/.config/extensions-sync.json`)

    2. Sync the `.json` file with your favourite syncing method (e.g. `Dropbox`, `dot-file source control` ([guide](https://www.atlassian.com/git/tutorials/dotfiles)), etc).

### Synced data

Toggle the data types to sync:

- **Extensions:** Extension installation status' and corresponding configuration values. Based on the *exporting* host data, this will:

  - Install extensions that **are not installed** on the *importing* host, but **are** on the *exporting* host.
  - Uninstalls extensions that **are installed** on the *importing* host, but **not** on the *exporting* host.
  - Syncs configuration values of all installed extensions.

- **Keybindings:** GNOME Shell keybindings. Syncs all values from the following `dconf` paths:

    ```bash
    /org/gnome/mutter/keybindings/
    /org/gnome/mutter/wayland/keybindings/
    /org/gnome/shell/keybindings/
    /org/gnome/desktop/wm/keybindings/
    /org/gnome/settings-daemon/plugins/media-keys/
    ```

- **Tweaks:** GNOME Tweaks configuration values. Syncs all values from the following `dconf` paths:

    ```bash
    /org/gnome/desktop/background/
    /org/gnome/desktop/calendar/
    /org/gnome/desktop/input-sources/
    /org/gnome/desktop/interface/
    /org/gnome/desktop/peripherals/
    /org/gnome/desktop/screensaver/
    /org/gnome/desktop/sound/
    /org/gnome/desktop/wm/preferences/
    /org/gnome/mutter/
    /org/gnome/settings-daemon/plugins/xsettings/
    ```

### Other settings

Basic extension settings that control how the extension behaves more broadly within the OS session:

- Show tray icon
- Show notifications

## CLI Usage

You can trigger upload download operations using `busctl`:

```bash
busctl --user call org.gnome.Shell /io/elhan/ExtensionsSync io.elhan.ExtensionsSync save # uploads to server
busctl --user call org.gnome.Shell /io/elhan/ExtensionsSync io.elhan.ExtensionsSync read # downloads to pc
```

## Development

### Environment

- Source language: `TypeScript`
- Build language: `JavaScript` (using `rollup`)
- Runtime/manager: `nodejs`/`yarn`

### Steps

1. Ensure `nodejs` is installed.

2. Clone the project:

    ```bash
    git clone https://github.com/oae/gnome-shell-extensions-sync.git
    cd ./gnome-shell-extensions-sync
    ```

3. Run the `yarn` script to install dependencies and build the extension:

    ```bash
    yarn install
    yarn build
    ```

4. If the extension is already installed, move/backup the existing folder:

    ```bash
    mv "$HOME/.local/share/gnome-shell/extensions/extensions-sync@elhan.io" \
        "$HOME/.local/share/gnome-shell/extensions/extensions-sync@elhan.io-backup"
    ```

5. Link the development environment`s build path to where the installed extension would normally live:

    ```bash
    ln -s "$PWD/dist" "$HOME/.local/share/gnome-shell/extensions/extensions-sync@elhan.io"
    ```

6. During development, run `yarn watch` to update the build as changes to the code are saved.

7. Preview the updated build by starting a nested GNOME session:

    ```bash
    dbus-run-session -- gnome-shell --nested --wayland
    ```

### Tips

- A custom resolution of the nested session can be defined via an environment variable:

    ```bash
    export MUTTER_DEBUG_DUMMY_MODE_SPECS=1024x768
    ```
