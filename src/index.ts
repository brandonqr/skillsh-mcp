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
    const url = `https://skills.sh/${owner}/${repo}/${skillId}`;

    // Note: skills.sh doesn't have a public API for skill details
    // This returns the URL and install command
    return {
      content: [
        {
          type: 'text',
          text: `Skill Details:\n` +
            `- Owner: ${owner}\n` +
            `- Repo: ${repo}\n` +
            `- Skill ID: ${skillId}\n` +
            `- URL: ${url}\n` +
            `- Install: \`npx skills add ${owner}/${repo}\``,
        },
      ],
    };
  }

  private async getPopularSkills(args: {
    limit?: number;
    timeframe?: string;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Note: The API endpoint for leaderboard might be different
    // For now, we'll search for common terms to get popular skills
    const popularQueries = ['react', 'typescript', 'next', 'vue', 'python'];
    const allSkills: Skill[] = [];

    try {
      for (const query of popularQueries) {
        const url = `${this.API_BASE}/search?q=${encodeURIComponent(query)}&limit=10`;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MCP-Skills-Sh/1.0.0',
          },
        });

        if (response.ok) {
          const data: SearchResponse = await response.json();
          allSkills.push(...data.skills);
        }
      }

      // Remove duplicates and sort by installs
      const uniqueSkills = Array.from(
        new Map(allSkills.map((skill) => [skill.id, skill])).values()
      ).sort((a, b) => b.installs - a.installs);

      const limit = args.limit || 20;
      const topSkills = uniqueSkills.slice(0, limit);

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
            text: `Top ${limit} Popular Skills:\n\n${skillsList}`,
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
