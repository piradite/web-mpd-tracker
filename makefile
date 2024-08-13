CC = gcc
CFLAGS = -Wall -Wextra -O2
LIBS = -lmpdclient -lcurl
TARGET = get-song
INSTALL_DIR = /usr/local/bin
SRC = main.c
SERVICE_FILE = /etc/systemd/system/get-song.service
TIMER_FILE = /etc/systemd/system/get-song.timer
USER = $(shell whoami)
HOME_DIR = $(shell eval echo ~$(USER))

check-root:
	@if [ "$$(id -u)" -eq "0" ]; then \
		echo "It is not recommended to run this makefile with SUDO. Are you sure? (y/n): "; \
		read -r confirmation; \
		confirmation=$$(echo "$$confirmation" | tr '[:upper:]' '[:lower:]'); \
		if [ "$$confirmation" != "y" ]; then \
			echo "Aborted."; \
			exit 1; \
		fi \
	fi

all: check-root $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC) $(LIBS)

install: $(TARGET) check-root
	@sudo mv $(TARGET) $(INSTALL_DIR)/$(TARGET)
	@sudo chmod 755 $(INSTALL_DIR)/$(TARGET)
	@echo "Installed $(TARGET) to $(INSTALL_DIR)/$(TARGET)"
	@echo "[Unit]" | sudo tee $(SERVICE_FILE) > /dev/null
	@echo "Description=Run get-song script" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo -e "" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "[Service]" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "ExecStart=$(INSTALL_DIR)/$(TARGET)" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "Type=oneshot" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "Restart=on-failure" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "RestartSec=5" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "StandardOutput=journal" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "StandardError=journal" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "User=$(USER)" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "Environment=DISPLAY=:0" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "Environment=XAUTHORITY=$(HOME_DIR)/.Xauthority" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo -e "" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "[Install]" | sudo tee -a $(SERVICE_FILE) > /dev/null
	@echo "WantedBy=default.target" | sudo tee -a $(SERVICE_FILE) > /dev/null

	@echo "[Unit]" | sudo tee $(TIMER_FILE) > /dev/null
	@echo "Description=Run get-song script every 5 seconds" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo -e "" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo "[Timer]" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo "OnBootSec=5sec" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo "OnUnitActiveSec=5sec" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo "AccuracySec=1s" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo "Persistent=true" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo -e "" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo "[Install]" | sudo tee -a $(TIMER_FILE) > /dev/null
	@echo "WantedBy=timers.target" | sudo tee -a $(TIMER_FILE) > /dev/null

	@sudo chmod 644 $(SERVICE_FILE)
	@sudo chmod 644 $(TIMER_FILE)
	@sudo systemctl daemon-reload
	@sudo systemctl enable get-song.service
	@sudo systemctl enable get-song.timer
	@sudo systemctl start get-song.timer
	@echo "Installed and started service and timer"
	@sudo systemctl daemon-reload
	@sudo systemctl restart get-song.service
	@sudo systemctl restart get-song.timer

clean:
	@rm -f $(TARGET)

uninstall: check-root
	@sudo systemctl stop $(TARGET).timer
	@sudo systemctl disable $(TARGET).timer
	@sudo systemctl stop $(TARGET).service
	@sudo systemctl disable $(TARGET).service
	@sudo rm -f $(INSTALL_DIR)/$(TARGET)
	@sudo rm -f $(SERVICE_FILE)
	@sudo rm -f $(TIMER_FILE)
	@echo "Uninstalled $(TARGET) and related systemd files"
	@sudo systemctl daemon-reload

.PHONY: all clean install uninstall check-root
