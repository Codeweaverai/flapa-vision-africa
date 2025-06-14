
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, BookOpen, Award, Globe, Mail } from 'lucide-react';

interface CreatorProfile {
  id: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  average_rating?: number;
  total_courses?: number;
  total_students?: number;
  total_reviews?: number;
}

interface CreatorCardProps {
  creator: CreatorProfile;
}

const CreatorCard = ({ creator }: CreatorCardProps) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <Avatar className="w-20 h-20 mx-auto mb-3">
            <AvatarImage src={creator.avatar_url} />
            <AvatarFallback className="text-lg bg-gradient-to-br from-purple-400 to-orange-400 text-white">
              {creator.full_name?.split(' ').map((n: string) => n[0]).join('') || 'IN'}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg text-gray-800 mb-1">
            {creator.full_name || 'Anonymous Instructor'}
          </h3>
          <p className="text-sm text-purple-600 mb-3">Course Creator</p>
          
          {/* Creator Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center justify-center mb-1">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm font-semibold">{creator.average_rating || 0}</span>
              </div>
              <div className="text-xs text-purple-600">Rating</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
              <div className="flex items-center justify-center mb-1">
                <BookOpen className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm font-semibold">{creator.total_courses || 0}</span>
              </div>
              <div className="text-xs text-orange-600">Courses</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-sm font-semibold">{creator.total_students || 0}</span>
              </div>
              <div className="text-xs text-purple-600">Students</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
              <div className="flex items-center justify-center mb-1">
                <Award className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm font-semibold">{creator.total_reviews || 0}</span>
              </div>
              <div className="text-xs text-orange-600">Reviews</div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {creator.bio}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            asChild 
            className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600"
          >
            <Link to={`/creator/${creator.id}`}>
              <Globe className="w-4 h-4 mr-2" />
              View Profile
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Instructor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorCard;
