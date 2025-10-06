# Building on Linux

This guide provides instructions for building the Arona Assistant application from source on Linux, with a focus on Debian-based distributions.

## 1. Install Dependencies

Before building, you need to install the necessary dependencies for Tauri development. Open a terminal and run the following command:

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    librsvg2-dev
```

## 2. Install Node.js and npm

If you don't have Node.js and npm installed, you can install them using a node version manager like `nvm` or directly from your distribution's package manager.

## 3. Build the Application

Once the dependencies are installed, you can build the application by running the following commands in the project's root directory:

```bash
# Install project dependencies
npm install

# Build the application
npm run tauri build
```

After the build process is complete, you will find the `.deb` and `AppImage` packages in the `src-tauri/target/release/bundle/` directory.
