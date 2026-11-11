#!/bin/bash

# Encontra o processo de server.js rodando no loop e mata
pkill -f "node server.js"

# Atualiza com git pull
git pull