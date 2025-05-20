
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from '@/components/ui/carousel';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Mic, FileDown, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { getMediaPosts, MediaPost } from '@/services/mediaService';

const MediaSection = () => {
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        // Fetch all types of published posts and limit to 6 for homepage display
        const allPosts = await getMediaPosts();
        setPosts(allPosts.slice(0, 6));
      } catch (error) {
        console.error('Error loading media posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const formatCategoryName = (category: string | undefined): string => {
    if (!category) return '';
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPostIcon = (postType: string) => {
    switch (postType) {
      case 'news':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'podcast':
        return <Mic className="h-4 w-4 mr-2" />;
      case 'resource':
        return <FileDown className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="heading-md text-gradient">Latest Insights</h2>
            <p className="text-lg text-gray-600 mt-2">
              Explore our latest news, podcasts, and resources
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/media" className="flex items-center gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="mt-4 text-lg font-medium">No media posts available</h3>
            <p className="mt-2 text-gray-500">Check back soon for new content.</p>
          </div>
        ) : (
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {posts.map((post) => (
                <CarouselItem key={post.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full flex flex-col">
                    <div className="relative h-48">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-t-lg">
                          {getPostIcon(post.post_type)}
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 capitalize">
                        {post.post_type}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.category && (
                          <Badge variant="outline">
                            {formatCategoryName(post.category)}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(post.published_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {post.summary || post.content.substring(0, 150) + '...'}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/media/${post.id}`}>
                          Read More
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:flex">
              <CarouselPrevious className="relative -left-4" />
              <CarouselNext className="relative -right-4" />
            </div>
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default MediaSection;
