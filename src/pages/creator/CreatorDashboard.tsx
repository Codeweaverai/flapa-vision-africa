
// Fix the specific function causing the error
// The error occurs around line 361 in the calculateMonthlyRevenue function

// Let's revise the full implementation of the function:

const calculateMonthlyRevenue = (enrollments: any[]) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Initialize the monthly revenue with zeros for all months
  const monthlyRevenue = monthNames.map(name => ({ name, revenue: 0 }));
  
  if (!enrollments || enrollments.length === 0) {
    return monthlyRevenue;
  }
  
  enrollments.forEach(enrollment => {
    if (enrollment?.payment_status === 'completed' && enrollment?.course) {
      const enrollmentDate = new Date(enrollment.enrollment_date);
      const monthIndex = enrollmentDate.getMonth();
      const price = enrollment?.course?.price ? Number(enrollment.course.price) : 0;
      
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyRevenue[monthIndex] = {
          name: monthlyRevenue[monthIndex].name,
          revenue: Number(monthlyRevenue[monthIndex].revenue) + price
        };
      }
    }
  });
  
  return monthlyRevenue;
};
