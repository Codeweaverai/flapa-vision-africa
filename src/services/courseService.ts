
// Add a function to create a course with creator_id
export const createCourseWithCreator = async (
  courseData: Omit<Course, "id" | "created_at" | "updated_at">, 
  creatorId: string
): Promise<Course | null> => {
  try {
    // Ensure required fields are present
    if (!courseData.title || !courseData.description || !courseData.summary || 
        !courseData.category || !courseData.difficulty_level || 
        courseData.duration_minutes === undefined) {
      console.error('Error creating course: Missing required fields');
      toast.error('Please fill in all required fields');
      return null;
    }
    
    // Create the complete course object with required fields
    const courseWithCreator = {
      title: courseData.title,
      description: courseData.description,
      summary: courseData.summary,
      category: courseData.category,
      difficulty_level: courseData.difficulty_level,
      duration_minutes: courseData.duration_minutes,
      is_free: courseData.is_free !== undefined ? courseData.is_free : true,
      price: courseData.price !== undefined ? courseData.price : 0,
      certificate_enabled: courseData.certificate_enabled !== undefined ? courseData.certificate_enabled : false,
      is_published: courseData.is_published !== undefined ? courseData.is_published : false,
      creator_id: creatorId,
    };

    const { data, error } = await supabase
      .from('courses')
      .insert(courseWithCreator)
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      throw error;
    }

    return data as Course;
  } catch (error) {
    console.error('Error in createCourseWithCreator:', error);
    return null;
  }
};
