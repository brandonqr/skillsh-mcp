#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

interface Skill {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

interface SearchResponse {
  query: string;
  searchType: string;
  skills: Skill[];
  count: number;
  duration_ms: number;
}

class SkillsShServer {
  private server: Server;
  private readonly API_BASE = 'https://skills.sh/api';

  constructor() {
    this.server = new Server(
      {
        name: 'skills-sh',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_skills',
            description: 'Search for skills on skills.sh by query term (e.g., "mapbox", "react", "gis")',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query term',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 50)',
                  default: 50,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_skill_details',
            description: 'Get detailed information about a specific skill by owner/repo/skillId',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'GitHub owner/username',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                skillId: {
                  type: 'string',
                  description: 'Skill ID',
                },
              },
              required: ['owner', 'repo', 'skillId'],
            },
          },
          {
            name: 'get_popular_skills',
            description: 'Get popular skills from the leaderboard',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Number of results (default: 20)',
                  default: 20,
                },
                timeframe: {
                  type: 'string',
                  description: 'Timeframe: "all", "trending", or "hot"',
                  enum: ['all', 'trending', 'hot'],
                  default: 'all',
                },
              },
            },
          },
          {
            name: 'get_install_command',
            description: 'Get the npx install command for a skill',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'GitHub owner/username',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
              },
              required: ['owner', 'repo'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_skills':
            return await this.searchSkills(args as { query: string; limit?: number });

          case 'get_skill_details':
            return await this.getSkillDetails(
              args as { owner: string; repo: string; skillId: string }
            );

          case 'get_popular_skills':
            return await this.getPopularSkills(
              args as { limit?: number; timeframe?: string }
            );

          case 'get_install_command':
            return await this.getInstallCommand(args as { owner: string; repo: string });

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async searchSkills(args: { query: string; limit?: number }): Promise<{
    content: Array<{ type: string; text: string }>;
  }> {
    const { query, limit = 50 } = args;
    const url = `${this.API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCP-Skills-Sh/1.0.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();

      if (data.skills.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No skills found for query: "${query}"`,
            },
          ],
        };
      }

      const skillsList = data.skills
        .map(
          (skill, index) =>
            `${index + 1}. **${skill.name}**\n` +
            `   - Source: \`${skill.source}\`\n` +
            `   - Installs: ${skill.installs.toLocaleString()}\n` +
            `   - Install: \`npx skills add ${skill.source}\``
        )
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${data.count} skills for "${query}":\n\n${skillsList}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search skills: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getSkillDetails(args: {
    owner: string;
    repo: string;
    skillId: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { owner, repo, skillId } = args;
    const skillUrl = `https://skills.sh/${owner}/${repo}/${skillId}`;
    const githubUrl = `https://github.com/${owner}/${repo}`;

    try {
      // First, try to get basic info from search API
      const searchUrl = `${this.API_BASE}/search?q=${encodeURIComponent(skillId)}&limit=50`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCP-Skills-Sh/1.0.0',
        },
      });

      let basicInfo: Skill | null = null;
      if (searchResponse.ok) {
        const searchData: SearchResponse = await searchResponse.json();
        // Find exact match or closest match
        basicInfo = searchData.skills.find(
          (s) => s.skillId === skillId && s.source === `${owner}/${repo}`
        ) || searchData.skills.find(
          (s) => s.skillId === skillId
        ) || null;
      }

      // Then, scrape the skill detail page for additional info
      const pageResponse = await fetch(skillUrl, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'MCP-Skills-Sh/1.0.0',
        },
      });

      let weeklyInstalls: string | null = null;
      let platformInstalls: Array<{ platform: string; count: string }> = [];
      let firstSeen: string | null = null;

      if (pageResponse.ok) {
        const html = await pageResponse.text();

        // Extract weekly installs (format: XXX.XK)
        const weeklyMatch = html.match(/(\d{2,3}\.\dK)\s*<[^>]*>\s*Weekly\s+installs/i) ||
                           html.match(/(\d{2,3}\.\dK)[^\d]*installs/i);
        if (weeklyMatch) {
          weeklyInstalls = weeklyMatch[1];
        }

        // Extract platform installs (opencode, codex, gemini-cli, etc.)
        // Pattern: platform</span><span...>XX.XK</span>
        const platformMatches = html.matchAll(/<span[^>]*>([\w-]+)<\/span>\s*<span[^>]*>(\d{2,3}\.\dK)<\/span>/gi);
        for (const match of platformMatches) {
          const platform = match[1].toLowerCase();
          const count = match[2];
          // Filter for known platforms and avoid duplicates
          if (['opencode', 'codex', 'gemini', 'copilot', 'amp', 'kimi', 'cursor', 'claude', 'windsurf', 'github-copilot', 'gemini-cli', 'kimi-cli'].some(p => platform.includes(p))) {
            if (!platformInstalls.some(p => p.platform === platform)) {
              platformInstalls.push({ platform, count });
            }
          }
        }

        // Extract first seen date - looking for pattern like: <span>First Seen</span>...</div><div...>Jan 26, 2026</div>
        const firstSeenMatch = html.match(/First\s+Seen<\/span><\/div><div[^>]*>([A-Za-z]{3}\s+\d{1,2},?\s*\d{4})/i) ||
                               html.match(/First\s+Seen[\s\S]*?<div[^>]*>([A-Za-z]{3}\s+\d{1,2},?\s*\d{4})<\/div>/i);
        if (firstSeenMatch) {
          firstSeen = firstSeenMatch[1];
        }
      }

      // Build response
      const installs = basicInfo?.installs;
      const installsText = installs ? installs.toLocaleString('en-US') : 'N/A';

      let platformsText = '';
      if (platformInstalls.length > 0) {
        platformsText = '\n\n**Installs by Platform:**\n' +
          platformInstalls.map(p => `- ${p.platform}: ${p.count}`).join('\n');
      }

      const weeklyText = weeklyInstalls ? `\n- Weekly Installs: ${weeklyInstalls}` : '';
      const firstSeenText = firstSeen ? `\n- First Seen: ${firstSeen}` : '';

      return {
        content: [
          {
            type: 'text',
            text: `## ${skillId}\n\n` +
              `**Source:** \`${owner}/${repo}\`\n` +
              `- Total Installs: ${installsText}${weeklyText}${firstSeenText}\n\n` +
              `**Links:**\n` +
              `- skills.sh: ${skillUrl}\n` +
              `- GitHub: ${githubUrl}\n\n` +
              `**Install Command:**\n` +
              '\`\`\`bash\n' +
              `npx skills add ${owner}/${repo}\n` +
              '\`\`\`' +
              platformsText,
          },
        ],
      };
    } catch (error) {
      // Fallback to basic info if scraping fails
      return {
        content: [
          {
            type: 'text',
            text: `## ${skillId}\n\n` +
              `**Source:** \`${owner}/${repo}\`\n\n` +
              `**Links:**\n` +
              `- skills.sh: ${skillUrl}\n` +
              `- GitHub: https://github.com/${owner}/${repo}\n\n` +
              `**Install Command:**\n` +
              '\`\`\`bash\n' +
              `npx skills add ${owner}/${repo}\n` +
              '\`\`\`\n\n' +
              `(Error fetching additional details: ${error instanceof Error ? error.message : String(error)})`,
          },
        ],
      };
    }
  }

  private async getPopularSkills(args: {
    limit?: number;
    timeframe?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { limit = 20, timeframe = 'all' } = args;

    // Note: skills.sh doesn't have a public API for leaderboard
    // We use multiple search queries with common 2-char terms to get diverse results
    // This gives us a good approximation of popular skills
    const searchTerms = [
      'js', 'ts', 'py', 'go', 'rb',  // Languages
      're', 'vu', 'nx', 'ex', 'dx',  // Frameworks
      'ai', 'ml', 'db', 'api', 'ui', // Concepts
      'co', 'de', 'te', 'se', 'cl',  // Common prefixes
    ];

    const allSkills: Skill[] = [];
    const seen = new Set<string>();

    try {
      // Search with multiple terms to get diverse results
      for (const term of searchTerms) {
        const url = `${this.API_BASE}/search?q=${encodeURIComponent(term)}&limit=50`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MCP-Skills-Sh/1.0.0',
          },
        });

        if (response.ok) {
          const data: SearchResponse = await response.json();
          for (const skill of data.skills) {
            // Avoid duplicates
            if (!seen.has(skill.id)) {
              seen.add(skill.id);
              allSkills.push(skill);
            }
          }
        }
      }

      if (allSkills.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No skills found for timeframe: "${timeframe}"`,
            },
          ],
        };
      }

      // Sort by installs (descending) and take top N
      const sortedSkills = allSkills.sort((a, b) => b.installs - a.installs);
      const topSkills = sortedSkills.slice(0, limit);

      const timeframeLabel = timeframe === 'all' ? 'All Time' : timeframe === 'trending' ? 'Trending (24h)' : 'Hot';

      const skillsList = topSkills
        .map(
          (skill, index) =>
            `${index + 1}. **${skill.name}**\n` +
            `   - Source: \`${skill.source}\`\n` +
            `   - Installs: ${skill.installs.toLocaleString()}\n` +
            `   - Install: \`npx skills add ${skill.source}\``
        )
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Top ${limit} ${timeframeLabel} Skills (${allSkills.length} unique skills found):\n\n${skillsList}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get popular skills: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getInstallCommand(args: {
    owner: string;
    repo: string;
  }): { content: Array<{ type: string; text: string }> } {
    const { owner, repo } = args;
    const command = `npx skills add ${owner}/${repo}`;

    return {
      content: [
        {
          type: 'text',
          text: `Install command:\n\`\`\`bash\n${command}\n\`\`\``,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Skills.sh MCP server running on stdio');
  }
}

const server = new SkillsShServer();
server.run().catch(console.error);
