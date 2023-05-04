import prisma from '../../../../lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

// Return a single post and all of its children
const handleGetPost = async (req: NextApiRequest, res: NextApiResponse) => {
  const posts: any[] = await prisma.$queryRaw`
	WITH RECURSIVE all_posts AS (
			SELECT
				posts. "id",
				"title",
				"body",
				"parentId",
				count("postUpvotes". "id") AS "upvotes",
				posts. "timestamp"
			FROM
				"NymPost" posts
			LEFT JOIN "DoxedUpvote" "postUpvotes" ON posts.id = "postUpvotes". "postId"
		GROUP BY
			posts. "id"
		UNION
		SELECT
			posts. "id",
			"title",
			"body",
			"parentId",
			count("postUpvotes". "id") AS "upvotes",
			posts. "timestamp"
		FROM
			"DoxedPost" posts
			LEFT JOIN "DoxedUpvote" "postUpvotes" ON posts.id = "postUpvotes". "postId"
		GROUP BY
			posts.id
		),
		thread AS (
			SELECT
				"id",
				"title",
				"body",
				"parentId",
				"upvotes",
				"timestamp"
			FROM
				all_posts
			WHERE
				"id" = ${req.query.postId}
			UNION
			SELECT
				d. "id",
				d. "title",
				d. "body",
				d. "parentId",
				d. "upvotes",
				d. "timestamp"
			FROM
				all_posts d
				INNER JOIN thread t ON d. "parentId" = t. "id"
		)
		SELECT
			*
		FROM
			thread;
  `;

  // `upvotes` is in BigInt, so we need to convert it to a number
  res.send(posts.map((post) => ({ ...post, upvotes: parseInt(post.upvotes) })));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'GET') {
    await handleGetPost(req, res);
  } else {
    res.status(400).send('Unsupported method');
  }
}
