package server

import (
	"fmt"
	"net/http"
	"time"

	"tiktok-scraper-transcriber/config"
)

func StartServer(cfg *config.Config) error {
	srv, err := NewServer(cfg)
	if err != nil {
		return fmt.Errorf("failed to initialize server: %w", err)
	}

	addr := ":" + cfg.Port
	httpServer := &http.Server{
		Addr:         addr,
		Handler:      srv.Routes(),
		ReadTimeout:  120 * time.Second,
		WriteTimeout: 120 * time.Second,
	}

	fmt.Println("========================================================")
	fmt.Printf("Web Server running at http://localhost:%s\n", cfg.Port)
	fmt.Printf("Local yt-dlp path: %s\n", cfg.YtDlpPath)
	if cfg.GroqAPIKey != "" {
		fmt.Println("Groq API Key: Detected in environment")
	} else {
		fmt.Println("Groq API Key: None detected (can be entered in Web UI)")
	}
	fmt.Println("========================================================")

	return httpServer.ListenAndServe()
}
