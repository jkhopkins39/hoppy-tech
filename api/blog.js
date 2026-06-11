import { getBearerToken, verifyAdminToken } from './_lib/auth.js';
import { applyCors } from './_lib/cors.js';

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await verifyAdminToken(getBearerToken(req)))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'jkhopkins39';
  const REPO_NAME = 'jkhopkins39.github.io';
  const FILE_PATH = 'public/data/blogPosts.json';
  const BRANCH = 'main';

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }

  try {
    const { action, post, postId } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const getFileResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!getFileResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch current posts' });
    }

    const fileData = await getFileResponse.json();
    const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    const currentSha = fileData.sha;

    let updatedContent;
    let commitMessage;

    if (action === 'create') {
      if (!post) {
        return res.status(400).json({ error: 'Post data is required for create action' });
      }
      updatedContent = [post, ...currentContent];
      commitMessage = `BLOG POST: ${post.title}`;
    } else if (action === 'update') {
      if (!post || !postId) {
        return res.status(400).json({ error: 'Post data and postId are required for update action' });
      }
      updatedContent = currentContent.map((p) => (p.id === postId ? post : p));
      commitMessage = `BLOG UPDATE: ${post.title}`;
    } else if (action === 'delete') {
      if (!postId) {
        return res.status(400).json({ error: 'PostId is required for delete action' });
      }
      const postToDelete = currentContent.find((p) => p.id === postId);
      updatedContent = currentContent.filter((p) => p.id !== postId);
      commitMessage = `BLOG DELETE: ${postToDelete?.title || postId}`;
    } else {
      return res.status(400).json({ error: 'Invalid action. Use create, update, or delete' });
    }

    const newContent = JSON.stringify(updatedContent, null, 2);
    const encodedContent = Buffer.from(newContent).toString('base64');

    const updateResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: encodedContent,
          sha: currentSha,
          branch: BRANCH,
        }),
      },
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: 'Failed to update blog posts' });
    }

    const result = await updateResponse.json();

    res.status(200).json({
      success: true,
      message: `Successfully ${action}d post`,
      commitUrl: result.commit?.html_url,
      commitMessage,
    });
  } catch (error) {
    console.error('Blog API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
