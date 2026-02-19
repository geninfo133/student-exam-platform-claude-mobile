from django.urls import path
from . import views

urlpatterns = [
    path('', views.StudyMaterialListView.as_view(), name='study-material-list'),
    path('manage/', views.TeacherStudyMaterialListView.as_view(), name='study-material-manage'),
    path('create/', views.StudyMaterialCreateView.as_view(), name='study-material-create'),
    path('<int:pk>/update/', views.StudyMaterialUpdateView.as_view(), name='study-material-update'),
    path('<int:pk>/delete/', views.StudyMaterialDeleteView.as_view(), name='study-material-delete'),
]
