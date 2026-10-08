# Printer Setup Guide

This guide covers discovering your physical printer name, configuring the **Obsidian Label** plugin for automated printing, and troubleshooting common operating system permissions and execution issues.

---

## 1. Finding Your Printer Name

The printer name must match the exact queue name recognized by your operating system's printing subsystem.

### Linux & macOS (CUPS)

Open a terminal and list configured CUPS printers:

```bash
lpstat -p
```

To display only the printer names:

```bash
lpstat -p | awk '{print $2}'
```

*Example Output:*
```text
Dymo-LabelWriter-450
Brother-QL-800
```

Use the exact printer name shown (case-sensitive on Unix).

### Windows (PowerShell)

Open PowerShell and query installed printers:

```powershell
Get-Printer | Select-Object -ExpandProperty Name
```

*Example Output:*
```text
DYMO LabelWriter 450 Turbo
Brother QL-800
Microsoft Print to PDF
```

Copy the exact name of your label printer.

---

## 2. Configuring Auto-Print in Obsidian

1. In Obsidian, navigate to **Settings** → **Community Plugins** → **Obsidian Label**.
2. Scroll to the **Print Helper Preferences** section.
3. Enter your printer name into the **Printer Name** input (e.g., `Dymo-LabelWriter-450` or `Brother QL-800`).
4. Toggle **Auto-Print after Generation** to **ON**.
5. *(Optional)* **Print Script Path**: Leave blank to automatically use the bundled helper scripts (`scripts/print-label.sh` on Linux/macOS, `scripts/print-label.ps1` on Windows). If you have custom thermal print arguments (e.g., orientation, cut options, darkness), enter the absolute path to your custom helper script.
6. Click the **Test Print** button to verify that a test label prints properly and your connection succeeds.

---

## 3. How It Works

- **Single Label Generation**: When auto-print is enabled, generating a label for any note will automatically save the PDF into your vault and immediately dispatch the PDF to the printer via the helper script without prompting.
- **Batch Regeneration Guard**: When regenerating all labels in your vault, a confirmation modal will prompt you with an explicit toggle to confirm whether to send all regenerated labels to the printer, protecting your physical label stock from accidental runs.
- **Timeout Protection**: The plugin enforces a 10-second execution timeout on helper scripts. If a print job stalls, the process is safely terminated and an Obsidian Notice alerts you.

---

## 4. Troubleshooting

### Linux

#### Permission Denied (`lp: Operation not permitted` or group permissions)
Ensure your current user belongs to the `lp` group to submit jobs to the CUPS spooler:

```bash
sudo usermod -aG lp $USER
```

*Note: You may need to log out and log back in for group membership changes to take effect.*

#### Script Execution Permission
If using a custom script or running from source:

```bash
chmod +x scripts/print-label.sh
```

#### CUPS Daemon Not Running
Ensure CUPS is active:

```bash
sudo systemctl status cups
sudo systemctl start cups
```

---

### macOS

#### CUPS Access or Sandboxing
Ensure the CUPS daemon is running. You can open the CUPS web administration interface in your browser:

```text
http://localhost:631/printers/
```

If the web interface is disabled, enable it in Terminal:

```bash
cupsctl WebInterface=yes
```

---

### Windows

#### Script Execution Blocked (`ExecutionPolicy`)
The plugin executes PowerShell helper scripts with `-ExecutionPolicy Bypass`. However, if your system or organization applies restricted execution policies, you can permit local script execution:

Run PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Default PDF Viewer Association
The Windows helper script uses `Start-Process -Verb PrintTo` to route the PDF through your system's default PDF handler. Ensure a standard PDF reader (such as Acrobat Reader, Foxit, or SumatraPDF) is associated with `.pdf` files.
