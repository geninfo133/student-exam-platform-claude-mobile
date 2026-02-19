from rest_framework import serializers
from .models import StudyMaterial, KeyConcept


class KeyConceptSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyConcept
        fields = ['id', 'title', 'description', 'formula', 'order']


class StudyMaterialSerializer(serializers.ModelSerializer):
    key_concepts = KeyConceptSerializer(many=True, read_only=True)
    chapter_name = serializers.CharField(source='chapter.name', read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StudyMaterial
        fields = [
            'id', 'title', 'content', 'file', 'order',
            'chapter', 'chapter_name', 'key_concepts',
            'uploaded_by', 'uploaded_by_name',
            'is_active', 'created_at', 'updated_at',
        ]

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
        return None


class KeyConceptWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    description = serializers.CharField()
    formula = serializers.CharField(required=False, allow_blank=True, default='')
    order = serializers.IntegerField(required=False, default=0)


class StudyMaterialCreateSerializer(serializers.ModelSerializer):
    key_concepts = KeyConceptWriteSerializer(many=True, required=False)

    class Meta:
        model = StudyMaterial
        fields = ['title', 'content', 'file', 'chapter', 'order', 'key_concepts']

    def validate(self, data):
        content = data.get('content', '')
        file = data.get('file')
        if not content and not file:
            raise serializers.ValidationError(
                'At least one of content or file must be provided.'
            )
        return data

    def create(self, validated_data):
        key_concepts_data = validated_data.pop('key_concepts', [])
        material = StudyMaterial.objects.create(**validated_data)
        for idx, kc in enumerate(key_concepts_data):
            KeyConcept.objects.create(
                study_material=material,
                title=kc['title'],
                description=kc['description'],
                formula=kc.get('formula', ''),
                order=kc.get('order', idx),
            )
        return material

    def update(self, instance, validated_data):
        key_concepts_data = validated_data.pop('key_concepts', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if key_concepts_data is not None:
            instance.key_concepts.all().delete()
            for idx, kc in enumerate(key_concepts_data):
                KeyConcept.objects.create(
                    study_material=instance,
                    title=kc['title'],
                    description=kc['description'],
                    formula=kc.get('formula', ''),
                    order=kc.get('order', idx),
                )
        return instance
