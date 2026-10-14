package config

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

type Config struct {
	GroqAPIKey     string
	DeepSeekAPIKey string
	TavilyAPIKey   string
	Port           string
	YtDlpPath      string
	TempDir        string
	DBPath         string
}

func LoadConfig() *Config {
	apiKey := os.Getenv("GROQ_API_KEY")
	deepseekKey := os.Getenv("DEEPSEEK_API_KEY")
	tavilyKey := os.Getenv("TAVILY_API_KEY")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	tempDir := os.Getenv("TEMP_DIR")
	if tempDir == "" {
		tempDir = filepath.Join("tmp")
	}
	_ = os.MkdirAll(tempDir, 0755)

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = filepath.Join("data", "studio.db")
	}

	ytDlpPath := ensureYtDlp()

	return &Config{
		GroqAPIKey:     apiKey,
		DeepSeekAPIKey: deepseekKey,
		TavilyAPIKey:   tavilyKey,
		Port:           port,
		YtDlpPath:      ytDlpPath,
		TempDir:        tempDir,
		DBPath:         dbPath,
	}
}

func ensureYtDlp() string {
	if custom := os.Getenv("YT_DLP_PATH"); custom != "" {
		return custom
	}

	binDir := "bin"
	_ = os.MkdirAll(binDir, 0755)

	binName := "yt-dlp"
	downloadURL := "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"

	if runtime.GOOS == "windows" {
		binName = "yt-dlp.exe"
		downloadURL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
	} else if runtime.GOOS == "darwin" {
		downloadURL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
	}

	localPath := filepath.Join(binDir, binName)

	// 1. Check if local binary in bin/ exists
	if fi, err := os.Stat(localPath); err == nil && !fi.IsDir() {
		return localPath
	}

	// 2. Check if yt-dlp is available in system PATH
	if sysPath, err := exec.LookPath("yt-dlp"); err == nil {
		return sysPath
	}

	// 3. Download automatically to bin/
	fmt.Println("[Setup] yt-dlp not found in bin/ or system PATH.")
	fmt.Printf("[Setup] Downloading latest release from GitHub to %s...\n", localPath)

	err := downloadBinary(downloadURL, localPath)
	if err != nil {
		fmt.Printf("[Warning] Failed to auto-download yt-dlp: %v\n", err)
		fmt.Println("[Warning] Falling back to 'yt-dlp' command. Please ensure it is installed manually.")
		return "yt-dlp"
	}

	// Ensure executable permissions on Unix
	if runtime.GOOS != "windows" {
		_ = os.Chmod(localPath, 0755)
	}

	fmt.Printf("[Setup] Successfully installed yt-dlp to %s\n", localPath)
	return localPath
}

func downloadBinary(url string, destPath string) error {
	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected HTTP status: %s", resp.Status)
	}

	tmpFile := destPath + ".tmp"
	out, err := os.OpenFile(tmpFile, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return fmt.Errorf("failed to create temporary file: %w", err)
	}

	_, err = io.Copy(out, resp.Body)
	closeErr := out.Close()
	if err != nil {
		_ = os.Remove(tmpFile)
		return fmt.Errorf("download stream failed: %w", err)
	}
	if closeErr != nil {
		_ = os.Remove(tmpFile)
		return fmt.Errorf("failed to finalize file: %w", closeErr)
	}

	if err := os.Rename(tmpFile, destPath); err != nil {
		_ = os.Remove(tmpFile)
		return fmt.Errorf("failed to place binary at destination: %w", err)
	}

	return nil
}
