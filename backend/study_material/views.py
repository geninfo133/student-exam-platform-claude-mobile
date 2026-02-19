import json

from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from accounts.permissions import IsSchoolOrTeacher
from .models import StudyMaterial
from .serializers import StudyMaterialSerializer, StudyMaterialCreateSerializer


class StudyMaterialListView(generics.ListAPIView):
    serializer_class = StudyMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = StudyMaterial.objects.filter(is_active=True).prefetch_related('key_concepts')
        chapter = self.request.query_params.get('chapter')
        if chapter:
            qs = qs.filter(chapter_id=chapter)
        return qs


class TeacherStudyMaterialListView(generics.ListAPIView):
    serializer_class = StudyMaterialSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolOrTeacher]

    def get_queryset(self):
        qs = StudyMaterial.objects.prefetch_related('key_concepts').select_related(
            'chapter', 'uploaded_by'
        )
        chapter = self.request.query_params.get('chapter')
        if chapter:
            qs = qs.filter(chapter_id=chapter)
        return qs


class StudyMaterialCreateView(generics.CreateAPIView):
    serializer_class = StudyMaterialCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolOrTeacher]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if isinstance(data.get('key_concepts'), str):
            try:
                data['key_concepts'] = json.loads(data['key_concepts'])
            except (json.JSONDecodeError, TypeError):
                data['key_concepts'] = []
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = StudyMaterialSerializer(serializer.instance).data
        return Response(output, status=status.HTTP_201_CREATED)


class StudyMaterialUpdateView(generics.UpdateAPIView):
    serializer_class = StudyMaterialCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolOrTeacher]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = StudyMaterial.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        if isinstance(data.get('key_concepts'), str):
            try:
                data['key_concepts'] = json.loads(data['key_concepts'])
            except (json.JSONDecodeError, TypeError):
                data['key_concepts'] = []
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        output = StudyMaterialSerializer(serializer.instance).data
        return Response(output)


class StudyMaterialDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolOrTeacher]
    queryset = StudyMaterial.objects.all()

    def perform_destroy(self, instance):
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()
