const express = require('express');
const router = express.Router();
const News = require('../models/News');
const Event = require('../models/Event');

// Search endpoint
router.post('/', async (req, res) => {
    try {
        const { query, types = ['news', 'policies', 'downloads'], dateRange = 'all', sortBy = 'relevance' } = req.body;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const searchResults = [];
        const searchRegex = new RegExp(query, 'i');

        // Date filtering
        let dateFilter = {};
        if (dateRange !== 'all') {
            const now = new Date();
            switch (dateRange) {
                case 'week':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
                    break;
                case 'month':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
                    break;
                case 'year':
                    dateFilter.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
                    break;
            }
        }

        // Search in news
        if (types.includes('news')) {
            const newsQuery = {
                $and: [
                    dateFilter,
                    {
                        $or: [
                            { title: searchRegex },
                            { content: searchRegex },
                            { excerpt: searchRegex },
                            { tags: { $in: [searchRegex] } }
                        ]
                    }
                ]
            };

            const newsResults = await News.find(newsQuery)
                .select('title content excerpt createdAt tags')
                .sort(sortBy === 'date' ? { createdAt: -1 } : { title: 1 })
                .limit(10);

            newsResults.forEach(news => {
                searchResults.push({
                    id: news._id,
                    title: news.title,
                    excerpt: news.excerpt || news.content.substring(0, 150) + '...',
                    type: 'news',
                    date: news.createdAt,
                    url: `/news.html#${news._id}`
                });
            });
        }

        // Search in events
        if (types.includes('events')) {
            const eventQuery = {
                $and: [
                    dateFilter,
                    {
                        $or: [
                            { title: searchRegex },
                            { description: searchRegex },
                            { location: searchRegex }
                        ]
                    }
                ]
            };

            const eventResults = await Event.find(eventQuery)
                .select('title description location startDate endDate')
                .sort(sortBy === 'date' ? { startDate: -1 } : { title: 1 })
                .limit(10);

            eventResults.forEach(event => {
                searchResults.push({
                    id: event._id,
                    title: event.title,
                    excerpt: event.description.substring(0, 150) + '...',
                    type: 'event',
                    date: event.startDate,
                    url: `/news.html#event-${event._id}`
                });
            });
        }

        // Search in policies (static content)
        if (types.includes('policies')) {
            const policies = [
                {
                    title: 'Economic Policy',
                    content: 'Our economic policy focuses on creating jobs, supporting small businesses, and ensuring economic growth that benefits all Kenyans.',
                    url: '/about.html#policies'
                },
                {
                    title: 'Education Policy',
                    content: 'We believe in quality education for all, with emphasis on technical skills, innovation, and preparing students for the future job market.',
                    url: '/about.html#policies'
                },
                {
                    title: 'Healthcare Policy',
                    content: 'Universal healthcare access, improved infrastructure, and preventive care are key components of our healthcare policy.',
                    url: '/about.html#policies'
                },
                {
                    title: 'Environmental Policy',
                    content: 'Sustainable development, renewable energy, and environmental protection are central to our environmental policy.',
                    url: '/about.html#policies'
                }
            ];

            policies.forEach(policy => {
                if (searchRegex.test(policy.title) || searchRegex.test(policy.content)) {
                    searchResults.push({
                        id: `policy-${policy.title.toLowerCase().replace(/\s+/g, '-')}`,
                        title: policy.title,
                        excerpt: policy.content.substring(0, 150) + '...',
                        type: 'policy',
                        date: new Date(),
                        url: policy.url
                    });
                }
            });
        }

        // Search in downloads (static content)
        if (types.includes('downloads')) {
            const downloads = [
                {
                    title: 'Party Constitution',
                    description: 'The official constitution of the Kenya Great Party outlining our principles, structure, and governance.',
                    url: '/downloads.html#constitution'
                },
                {
                    title: 'Financial Statements 2024',
                    description: 'Annual financial statements showing our party finances and transparency in financial management.',
                    url: '/downloads.html#financial'
                },
                {
                    title: 'Manifesto 2027',
                    description: 'Our comprehensive manifesto outlining our vision and plans for Kenya.',
                    url: '/downloads.html#manifesto'
                }
            ];

            downloads.forEach(download => {
                if (searchRegex.test(download.title) || searchRegex.test(download.description)) {
                    searchResults.push({
                        id: `download-${download.title.toLowerCase().replace(/\s+/g, '-')}`,
                        title: download.title,
                        excerpt: download.description.substring(0, 150) + '...',
                        type: 'download',
                        date: new Date(),
                        url: download.url
                    });
                }
            });
        }

        // Sort results
        if (sortBy === 'date') {
            searchResults.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sortBy === 'title') {
            searchResults.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            // Relevance sorting (simple implementation)
            searchResults.sort((a, b) => {
                const aRelevance = a.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
                const bRelevance = b.title.toLowerCase().includes(query.toLowerCase()) ? 2 : 1;
                return bRelevance - aRelevance;
            });
        }

        res.json({
            success: true,
            results: searchResults,
            total: searchResults.length,
            query: query
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error performing search',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }

        const suggestions = [];
        const searchRegex = new RegExp(q, 'i');

        // Get news titles
        const newsTitles = await News.find({ title: searchRegex })
            .select('title')
            .limit(5);

        newsTitles.forEach(news => {
            suggestions.push({
                text: news.title,
                type: 'news',
                url: `/news.html#${news._id}`
            });
        });

        // Get event titles
        const eventTitles = await Event.find({ title: searchRegex })
            .select('title')
            .limit(5);

        eventTitles.forEach(event => {
            suggestions.push({
                text: event.title,
                type: 'event',
                url: `/news.html#event-${event._id}`
            });
        });

        res.json({
            suggestions: suggestions.slice(0, 10)
        });

    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting search suggestions'
        });
    }
});

module.exports = router;
