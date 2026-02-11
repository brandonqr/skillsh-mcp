# Uso del MCP Server para skills.sh

Este servidor MCP permite buscar y gestionar skills de [skills.sh](https://skills.sh/) directamente desde Cursor o Claude Code.

## Configuración

### Para Claude Code

**Opción 1: Comando `claude mcp add` (recomendado)**

```bash
# Scope local (solo este proyecto, para ti)
claude mcp add skills-sh -- node /ruta/absoluta/a/skillsh-mcp/dist/index.js

# Scope proyecto (compartido con el equipo via .mcp.json)
claude mcp add skills-sh --scope project -- node /ruta/absoluta/a/skillsh-mcp/dist/index.js

# Scope usuario (disponible en todos tus proyectos)
claude mcp add skills-sh --scope user -- node /ruta/absoluta/a/skillsh-mcp/dist/index.js
```

**Opción 2: Archivo `.mcp.json` en la raíz del proyecto**

```json
{
  "mcpServers": {
    "skills-sh": {
      "command": "node",
      "args": ["/ruta/absoluta/a/skillsh-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

**Opción 3: Comando JSON directo**

```bash
claude mcp add-json skills-sh '{"command":"node","args":["/ruta/absoluta/a/skillsh-mcp/dist/index.js"]}'
```

**Gestión de servidores MCP en Claude Code:**

```bash
# Listar servidores configurados
claude mcp list

# Obtener detalles de un servidor
claude mcp get skills-sh

# Eliminar un servidor
claude mcp remove skills-sh
```

### Para Cursor

Agrega a `.cursor/mcp.json` en tu workspace:

```json
{
  "mcpServers": {
    "skills-sh": {
      "command": "node",
      "args": ["${workspaceFolder}/skillsh-mcp/dist/index.js"]
    }
  }
}
```

Luego reinicia Cursor para que cargue el servidor MCP.

---

## Herramientas Disponibles

### 1. `search_skills`
Busca skills en skills.sh por término de búsqueda.

**Ejemplo de uso:**
```
Busca skills relacionadas con "mapbox"
```

**Parámetros:**
- `query` (requerido): Término de búsqueda (ej: "mapbox", "react", "gis")
- `limit` (opcional): Número máximo de resultados (por defecto: 50)

---

### 2. `get_popular_skills`
Obtiene las skills más populares del leaderboard.

**Ejemplo de uso:**
```
Muéstrame las 10 skills más populares
```

**Parámetros:**
- `limit` (opcional): Número de resultados (por defecto: 20)
- `timeframe` (opcional): "all", "trending", o "hot" (por defecto: "all")

---

### 3. `get_skill_details`
Obtiene información detallada sobre una skill específica.

**Ejemplo de uso:**
```
Dame detalles de la skill mapbox/mapbox-agent-skills/mapbox-integration-patterns
```

**Parámetros:**
- `owner` (requerido): Usuario/organización de GitHub
- `repo` (requerido): Nombre del repositorio
- `skillId` (requerido): ID de la skill

---

### 4. `get_install_command`
Genera el comando de instalación para una skill.

**Ejemplo de uso:**
```
Dame el comando para instalar mapbox/mapbox-agent-skills
```

**Parámetros:**
- `owner` (requerido): Usuario/organización de GitHub
- `repo` (requerido): Nombre del repositorio

---

## Ejemplos de Uso

### Buscar skills de Mapbox
```
Usa search_skills para buscar skills relacionadas con "mapbox"
```

### Buscar skills de React
```
Busca skills de React usando search_skills
```

### Ver skills populares
```
Muéstrame las 20 skills más populares usando get_popular_skills
```

### Obtener comando de instalación
```
Dame el comando para instalar vercel-labs/agent-skills
```

---

## Notas

- En **Claude Code**: el servidor se conecta automáticamente al agregarlo con `claude mcp add`
- En **Cursor**: el servidor se conecta automáticamente cuando Cursor se inicia (requiere reinicio tras configurar)
- Las herramientas están disponibles en el chat de ambos clientes
- No necesitas ejecutar comandos manualmente, solo describe lo que necesitas

---

## Troubleshooting

Si el servidor no funciona:

1. Verifica que esté compilado:
   ```bash
   cd skillsh-mcp
   npm install
   npm run build
   ```

2. Verifica la configuración:
   - **Claude Code**: `claude mcp list` para ver servidores activos
   - **Cursor**: revisa `.cursor/mcp.json`

3. Reinicia el cliente (Cursor o Claude Code)

4. Verifica que la ruta al `dist/index.js` sea correcta y absoluta (para Claude Code)
