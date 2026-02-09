# Uso del MCP Server para skills.sh

Este servidor MCP permite buscar y gestionar skills de [skills.sh](https://skills.sh/) directamente desde Cursor.

## Herramientas Disponibles

### 1. `search_skills`
Busca skills en skills.sh por término de búsqueda.

**Ejemplo de uso en Cursor:**
```
Busca skills relacionadas con "mapbox"
```

**Parámetros:**
- `query` (requerido): Término de búsqueda (ej: "mapbox", "react", "gis")
- `limit` (opcional): Número máximo de resultados (por defecto: 50)

---

### 2. `get_popular_skills`
Obtiene las skills más populares del leaderboard.

**Ejemplo de uso en Cursor:**
```
Muéstrame las 10 skills más populares
```

**Parámetros:**
- `limit` (opcional): Número de resultados (por defecto: 20)
- `timeframe` (opcional): "all", "trending", o "hot" (por defecto: "all")

---

### 3. `get_skill_details`
Obtiene información detallada sobre una skill específica.

**Ejemplo de uso en Cursor:**
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

**Ejemplo de uso en Cursor:**
```
Dame el comando para instalar mapbox/mapbox-agent-skills
```

**Parámetros:**
- `owner` (requerido): Usuario/organización de GitHub
- `repo` (requerido): Nombre del repositorio

---

## Ejemplos de Uso en Cursor

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

- El servidor MCP se conecta automáticamente cuando Cursor se inicia
- Las herramientas están disponibles en el chat de Cursor
- No necesitas ejecutar comandos manualmente, solo describe lo que necesitas

---

## Troubleshooting

Si el servidor no funciona:

1. Verifica que esté compilado:
   ```bash
   cd mcp-skills-sh
   npm run build
   ```

2. Verifica la configuración en `.cursor/mcp.json`

3. Reinicia Cursor para que cargue el servidor MCP
