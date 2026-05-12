import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, AlertCircle, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesPage() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#10B981",
    icon: "Tag",
    monthlyBudgetLimit: "",
    budgetAlertThreshold: "80",
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = trpc.categories.list.useQuery(
    undefined as any,
    { enabled: !!user }
  );

  // Create custom category mutation
  const createCategory = trpc.categories.createCustom.useMutation({
    onSuccess: () => {
      toast.success("Category created successfully");
      resetForm();
      setIsOpen(false);
      refetchCategories();
    },
    onError: (error) => {
      toast.error("Failed to create category: " + error.message);
    },
  });

  // Update custom category mutation
  const updateCategory = trpc.categories.updateCustom.useMutation({
    onSuccess: () => {
      toast.success("Category updated successfully");
      resetForm();
      setIsOpen(false);
      refetchCategories();
    },
    onError: (error) => {
      toast.error("Failed to update category: " + error.message);
    },
  });

  // Delete custom category mutation
  const deleteCategory = trpc.categories.deleteCustom.useMutation({
    onSuccess: () => {
      toast.success("Category deleted successfully");
      refetchCategories();
    },
    onError: (error) => {
      toast.error("Failed to delete category: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#10B981",
      icon: "Tag",
      monthlyBudgetLimit: "",
      budgetAlertThreshold: "80",
    });
    setEditingId(null);
  };

  const handleOpenDialog = (category?: any) => {
    if (category && !category.isSystem) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        description: category.description || "",
        color: category.color || "#10B981",
        icon: category.icon || "Tag",
        monthlyBudgetLimit: category.monthlyBudgetLimit ? category.monthlyBudgetLimit.toString() : "",
        budgetAlertThreshold: category.budgetAlertThreshold?.toString() || "80",
      });
    } else {
      resetForm();
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter a category name");
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color,
      icon: formData.icon,
      monthlyBudgetLimit: formData.monthlyBudgetLimit ? parseFloat(formData.monthlyBudgetLimit) : undefined,
      budgetAlertThreshold: parseInt(formData.budgetAlertThreshold),
    };

    if (editingId) {
      updateCategory.mutate({
        categoryId: editingId,
        ...payload,
      });
    } else {
      createCategory.mutate(payload);
    }
  };

  const handleDelete = (categoryId: number) => {
    if (window.confirm("Are you sure you want to delete this category? Expenses in this category will not be deleted.")) {
      deleteCategory.mutate({ categoryId });
    }
  };

  // Filter to show only custom categories
  const customCategories = categories?.filter((c: any) => !c.isSystem) || [];
  const systemCategories = categories?.filter((c: any) => c.isSystem) || [];

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-6 border border-green-200 dark:border-green-800">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-green-900 dark:text-green-50">Categories</h1>
            <p className="text-green-700 dark:text-green-200 mt-1">Manage your expense categories and budget limits</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white btn-interactive" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader className="border-b border-green-200 dark:border-green-800 pb-4">
                <DialogTitle className="text-green-900 dark:text-green-50">{editingId ? "Edit Category" : "Create New Category"}</DialogTitle>
                <DialogDescription className="text-green-600 dark:text-green-400">
                  {editingId ? "Update your category details" : "Create a custom expense category with optional budget limit"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-green-900 dark:text-green-100 font-semibold">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Entertainment"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-green-900 dark:text-green-100 font-semibold">Description</Label>
                  <Input
                    id="description"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    placeholder="e.g., Tag"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetLimit">Monthly Budget Limit (Optional)</Label>
                <Input
                  id="budgetLimit"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={formData.monthlyBudgetLimit}
                  onChange={(e) => setFormData({ ...formData, monthlyBudgetLimit: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alertThreshold">Budget Alert Threshold (%)</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.budgetAlertThreshold}
                  onChange={(e) => setFormData({ ...formData, budgetAlertThreshold: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {createCategory.isPending || updateCategory.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingId ? "Updating..." : "Creating..."}
                  </>
                ) : editingId ? (
                  "Update Category"
                ) : (
                  "Create Category"
                )}
              </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error State */}
      {categoriesError && (
        <Card className="bg-destructive/10 border border-destructive/20 rounded-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Failed to load categories</h3>
                <p className="text-sm text-destructive/80 mt-1">There was an error loading your categories. Please try again.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchCategories()}>
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Categories */}
      <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Custom Categories</CardTitle>
          <CardDescription>{customCategories.length} custom categories</CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : customCategories.length > 0 ? (
            <div className="space-y-3">
              {customCategories.map((category: any) => (
                <div key={category.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: category.color || "#10B981" }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                        {category.monthlyBudgetLimit && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Monthly Budget: ${parseFloat(category.monthlyBudgetLimit).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Alert Threshold: {category.budgetAlertThreshold || 80}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(category)}
                      >
                        <Edit2 className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        disabled={deleteCategory.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No custom categories yet. Create one to get started!</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => handleOpenDialog()}>
                Create First Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Categories */}
      {systemCategories.length > 0 && (
        <Card className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <CardTitle>System Categories</CardTitle>
            <CardDescription>{systemCategories.length} default categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemCategories.map((category: any) => (
                <div key={category.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: category.color || "#10B981" }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
